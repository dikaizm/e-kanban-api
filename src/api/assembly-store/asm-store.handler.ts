import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import apiResponse from '../../utils/api-response';
import { db } from '../../db';
import { deliverOrderFabricationSchema, orderFabricationSchema, orderSchema, orderStoreSchema } from '../../models/order.model';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { partSchema, partShopFloorSchema, partStoreSchema } from '../../models/part.model';
import { KANBAN_ID, STATION_ID } from '../../const/global.const';

interface AsmStoreHandler {
  getAllOrders: HandlerFunction;
  updateOrderStatus: HandlerFunction;
  getAllParts: HandlerFunction;
  updatePartStatus: HandlerFunction;
}

async function getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await db
      .select()
      .from(orderStoreSchema)
      .innerJoin(partSchema, eq(partSchema.id, orderStoreSchema.partId))
      .orderBy(desc(orderStoreSchema.createdAt));

    // Check if orders is empty
    if (orders.length === 0) {
      res.json(apiResponse.success('Orders retrieved successfully', []));
      return;
    }

    // Get part stock from part store
    const partStore = await db.select().from(partStoreSchema);

    // Rewrite order data to include part details
    const ordersData = orders.map((item) => {
      const order = item.orders_store;
      const part = item.parts;
      const partStock = partStore.find((stock) => stock.partId === part.id);

      return {
        ...order,
        kanbanId: KANBAN_ID.PRODUCTION,
        partNumber: part.partNumber,
        partName: part.partName,
        stock: partStock?.stock,
      };
    });

    res.json(apiResponse.success('Orders retrieved successfully', ordersData));
  } catch (error) {
    next(error);
  }
}

async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      throw new Error('Invalid request');
    }

    // Check if order store exists
    const orderStore = await db.select().from(orderStoreSchema).where(eq(orderStoreSchema.id, id)).limit(1);
    if (orderStore.length === 0) {
      throw new Error('Order not found');
    }

    if (status !== 'production' && status !== 'deliver' && status !== 'finish') {
      throw new Error('Invalid status');
    }

    // Update order status
    if (status === 'production') {
      // Create new order and shop floor in fabrication
      await db.update(orderStoreSchema).set({ status: 'production' }).where(eq(orderStoreSchema.id, id));

      // Create new order
      const order = await db.insert(orderSchema).values({
        stationId: STATION_ID.FABRICATION,
        createdBy: req.body.user.id,
      });

      // Insert order in order fabrication
      await db.insert(orderFabricationSchema).values({
        orderId: order[0].insertId,
        partId: orderStore[0].partId,
        quantity: orderStore[0].quantity,
        status: 'pending',
      });

      // Insert to shop floor fabrication
      await db.insert(partShopFloorSchema).values({
        orderId: order[0].insertId,
        partId: orderStore[0].partId,
        status: 'pending',
        station: 'shop_floor',
      });

      // Change part store status to order_to_fabrication
      await db.update(partStoreSchema).set({ status: 'order_to_fabrication' }).where(eq(partStoreSchema.partId, orderStore[0].partId));

      res.status(201).json(apiResponse.success('Order to production created successfully', null));

    } else if (status === 'deliver') {
      await db.update(orderStoreSchema).set({ status: 'finish' }).where(eq(orderStoreSchema.id, id));

      // Get part
      const part = await db.select()
        .from(partSchema)
        .where(eq(partSchema.id, orderStore[0].partId))
        .limit(1);
      if (!part.length) {
        throw new Error('Part not found');
      }

      // Update quantity in parts
      await db.update(partSchema)
        .set({ quantity: part[0].quantity + orderStore[0].quantity! })
        .where(eq(partSchema.id, orderStore[0].partId));

      res.json(apiResponse.success('Order has been delivered successfully', null));
    }

  } catch (error) {
    next(error);
  }
}

async function getAllParts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parts = await db.select().from(partStoreSchema).innerJoin(partSchema, eq(partSchema.id, partStoreSchema.partId)).orderBy(desc(partStoreSchema.createdAt));

    const partsData = parts.map((item) => {
      const part = item.parts;
      const partStore = item.parts_store;

      return {
        ...partStore,
        partNumber: part.partNumber,
        partName: part.partName,
      };
    });

    res.json(apiResponse.success('Parts retrieved successfully', partsData));
  } catch (error) {
    next(error);
  }
}

async function updatePartStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      res.status(400).json(apiResponse.error('Invalid request, id and status are required'));
      return;
    }

    // Check if part store exists
    const partStore = await db.select().from(partStoreSchema).where(eq(partStoreSchema.id, id)).limit(1);
    if (partStore.length === 0) {
      res.status(404).json(apiResponse.error('Part not found'));
      return;
    }
    const currentStatus = partStore[0].status;
    if (currentStatus !== 'receive') {
      res.status(400).json(apiResponse.error('Part status is not receive'));
      return;
    }

    if (status !== 'idle') {
      res.status(400).json(apiResponse.error('Invalid status'));
      return;
    }

    // Get updated stock from deliver order fabrication where status is deliver
    const deliverOrders = await db.select().from(deliverOrderFabricationSchema).where(sql`status = 'deliver' and part_id = ${partStore[0].partId}`);
    if (deliverOrders.length === 0) {
      res.status(404).json(apiResponse.error('No deliver order found'));
      return;
    }
    // Get quantity from order fabrication, use wherein
    const orderFabrications = await db.select().from(orderFabricationSchema).where(inArray(orderFabricationSchema.id, deliverOrders.map((item) => item.orderFabId)));
    if (orderFabrications.length === 0) {
      res.status(404).json(apiResponse.error('No order fabrication found'));
      return;
    }

    // Count new stock
    const newStock = orderFabrications.reduce((acc, item) => acc + item.quantity, 0);

    // Update stock and part status
    await db.update(partStoreSchema).set({ status, stock: partStore[0].stock + newStock }).where(eq(partStoreSchema.id, id));

    // Update status deliver order to finish
    await db.update(deliverOrderFabricationSchema).set({ status: 'finish' }).where(inArray(deliverOrderFabricationSchema.orderFabId, orderFabrications.map((item) => item.id)));

    // Check if order with this part ready to deliver
    const orderStore = await db.select().from(orderStoreSchema).where(eq(orderStoreSchema.partId, partStore[0].partId));
    orderStore.forEach(async (order) => {
      if (order.quantity <= newStock) {
        await db.update(orderStoreSchema).set({ status: 'deliver' }).where(eq(orderStoreSchema.id, order.id));
      }
    });

    res.json(apiResponse.success('Part received successfully', null));
  } catch (error) {
    next(error);
  }
}

export default {
  getAllOrders,
  updateOrderStatus,
  getAllParts,
  updatePartStatus,
} satisfies AsmStoreHandler;