import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import apiResponse from '../../utils/api-response';
import { db } from '../../db';
import { orderFabricationSchema, orderSchema, orderStoreSchema } from '../../models/order.model';
import { desc, eq } from 'drizzle-orm';
import { partSchema, partStoreSchema } from '../../models/part.model';
import { STATION_ID } from '../../const/global.const';

interface AsmStoreHandler {
  getAllOrders: HandlerFunction;
  updateOrderStatus: HandlerFunction;
}

async function getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await db
      .select()
      .from(orderStoreSchema)
      .innerJoin(partSchema, eq(partSchema.id, orderStoreSchema.partId))
      .orderBy(desc(orderStoreSchema.created_at));

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
        id: order.id,
        orderId: order.orderId,
        kanbanId: 'RYIN001',
        partNumber: part.partNumber,
        partName: part.partName,
        quantity: order.quantity,
        stock: partStock?.stock,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
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
      await db.update(orderStoreSchema).set({ status: 'production' }).where(eq(orderStoreSchema.id, id));

      // Create new order
      const order = await db.insert(orderSchema).values({
        stationId: STATION_ID.FABRICATION,
        createdBy: req.body.user.id,
      });

      // Insert order in order fabrication
      await db.insert(orderFabricationSchema).values({
        orderId: order[0].insertId,
        quantity: orderStore[0].quantity,
      });

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

export default {
  getAllOrders,
  updateOrderStatus,
} satisfies AsmStoreHandler;