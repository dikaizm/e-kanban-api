import apiResponse from '../../utils/api-response';
import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import { db } from '../../db';
import { componentSchema, partComponentSchema, partSchema, partShopFloorSchema, partStoreSchema } from '../../models/part.model';
import { desc, eq } from 'drizzle-orm';
import { orderFabricationSchema, orderLineSchema, orderSchema, orderStoreSchema } from '../../models/order.model';
import { STATION_ID } from '../../const';
import { ApiErr } from '../../utils/api-error';
import { kanbanSchema, kanbanWithdrawalSchema } from '../../models/kanban.model';
import { generateQR } from '../../utils/qr-code';
import { KanbanFilterType } from '../../type';
import { stationSchema } from '../../models/station.model';

interface AsmLineHandler {
  getAllParts: HandlerFunction;
  getPartById: HandlerFunction;
  updatePartQuantity: HandlerFunction;

  createOrder: HandlerFunction;
  deleteOrderById: HandlerFunction;

  startAssembleComponent: HandlerFunction;
  getAllKanbans: HandlerFunction;
}

const PART_STATUS = {
  COMPLETE: 'Complete',
  INCOMPLETE: 'Incomplete',
};

async function getAllParts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parts = await db.select().from(partSchema);

    // Check part status
    let partStatus = PART_STATUS.COMPLETE;
    parts.forEach((part) => {
      if (part.quantityReq > part.quantity) {
        partStatus = PART_STATUS.INCOMPLETE;
      }
    });

    res.json(apiResponse.success('Parts retrieved successfully', { parts, partStatus }));
  } catch (error) {
    next(error);
  }
}

async function getPartById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      throw ApiErr('Invalid request', 400);
    }

    const part = await db.select().from(partSchema).where(eq(partSchema.id, parseInt(id)));
    if (part.length === 0) {
      throw ApiErr('Part not found', 404);
    }

    res.json(apiResponse.success('Part retrieved successfully', part[0]));

  } catch (error) {
    next(error);
  }
}

async function updatePartQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, quantity } = req.body;
    if (!id || !quantity) {
      throw ApiErr('Invalid request', 400);
    }

    if (parseInt(quantity) <= 0) {
      throw ApiErr('Quantity must be greater than 0', 400);
    }

    const partId = parseInt(id);

    const result = await db.update(partSchema).set({ quantity }).where(eq(partSchema.id, partId));
    if (result[0].affectedRows === 0) {
      throw ApiErr('Part not found', 404);
    }

    res.json(apiResponse.success('Part quantity updated successfully', null));

  } catch (error) {
    next(error);
  }
}

async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { partNumber, quantity, requestHost } = req.body;
    if (!partNumber || !quantity) {
      res.status(400).json(apiResponse.error('Invalid request'));
    }

    if (parseInt(quantity) <= 0) {
      res.status(400).json(apiResponse.error('Quantity must be greater than 0'));
    }

    const parts = await db.select().from(partSchema).where(eq(partSchema.partNumber, partNumber));
    if (parts.length === 0) {
      res.status(404).json(apiResponse.error('Part not found'));
    }

    const part = parts[0];

    // Insert to order
    const order = await db.insert(orderSchema).values({
      stationId: STATION_ID.ASSEMBLY_STORE,
      createdBy: req.body.user.id,
    });

    // Check part stock in store
    let partStore = await db.select().from(partStoreSchema).where(eq(partStoreSchema.partId, part.id)).limit(1);
    if (partStore.length === 0) {
      // Insert to part store
      await db.insert(partStoreSchema).values({
        partId: part.id,
        stock: 0,
        status: 'idle',
      });

      partStore = await db.select().from(partStoreSchema).where(eq(partStoreSchema.partId, part.id)).limit(1);
    }

    // Insert to order store
    await db.insert(orderStoreSchema).values({
      orderId: order[0].insertId,
      partId: part.id,
      quantity: quantity,
      status: 'pending',
    });

    // Insert to kanban
    const currentTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');
    const kanbanId = `${Math.random().toString(36).substr(2, 8)}-${Math.floor(Math.random() * 1E7)}`;

    const qrCodeContent = `${requestHost}/confirm-kanban/${kanbanId}`;
    const qrCode = await generateQR(qrCodeContent);

    const newKanban = await db.insert(kanbanSchema).values({
      id: kanbanId,
      cardId: 'RYIN001',
      type: 'production',
      status: 'queue',
      qrCode: qrCode,
      orderId: order[0].insertId,
      orderDate: currentTime,
      planStart: currentTime,
      stationId: STATION_ID.ASSEMBLY_LINE,
    });
    if (newKanban[0].affectedRows === 0) {
      throw ApiErr('Failed to create kanban', 500);
    }

    res.json(apiResponse.success('Order created successfully', null));
  } catch (error) {
    next(error);
  }
}

async function deleteOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      throw ApiErr('Invalid request', 400);
    }

    const orderId = parseInt(id);

    // Check order status
    const order = await db.select().from(orderSchema).where(eq(orderSchema.id, orderId));
    if (order.length === 0) {
      throw ApiErr('Order not found', 404);
    }

    // Check if part shop floor status already in progress
    const partShopFloor = await db.select().from(partShopFloorSchema).where(eq(partShopFloorSchema.orderId, orderId));
    if (partShopFloor.length > 0) {
      if (partShopFloor[0].status === 'in_progress') {
        throw ApiErr('Cannot delete order, part fabrication already in progress', 400);
      } else if (partShopFloor[0].status === 'finish') {
        throw ApiErr('Cannot delete order, part fabrication already finished', 400);
      }
    }

    // Delete order line
    await db.delete(orderLineSchema).where(eq(orderLineSchema.orderId, orderId));

    // Delete order store
    await db.delete(orderStoreSchema).where(eq(orderStoreSchema.orderId, orderId));

    // Delete order fabrication
    await db.delete(orderFabricationSchema).where(eq(orderFabricationSchema.orderId, orderId));

    // Delete part shop floor
    await db.delete(partShopFloorSchema).where(eq(partShopFloorSchema.orderId, orderId));

    // Delete kanban
    await db.delete(kanbanSchema).where(eq(kanbanSchema.orderId, orderId));

    // Delete order
    await db.delete(orderSchema).where(eq(orderSchema.id, orderId));

    res.json(apiResponse.success('Order deleted successfully', null));
  } catch (error) {
    next(error);
  }
}

async function startAssembleComponent(req: Request, res: Response, next: NextFunction) {
  try {
    const { requestHost, componentId } = req.body;
    if (!requestHost || !componentId) {
      throw ApiErr('Invalid request', 400);
    }

    // Update each part quantity
    const parts = await db.select().from(partSchema);

    let isPartComponentExist = false;
    const partComponent = await db.select().from(partComponentSchema).where(eq(partComponentSchema.componentId, componentId));
    if (partComponent.length > 0) {
      isPartComponentExist = true;
    }

    for (const part of parts) {
      // Count part availability
      const newQuantity = part.quantity - part.quantityReq;
      if (newQuantity < 0) {
        throw ApiErr('Part quantity does not meet requirement', 400);
      }
      await db.update(partSchema).set({ quantity: newQuantity }).where(eq(partSchema.id, part.id));

      // Insert to part component if not exist
      if (!isPartComponentExist) {
        await db.insert(partComponentSchema).values({
          componentId: componentId,
          partId: part.id,
        });
      }
    }

    // Create new order
    const newOrder = await db.insert(orderSchema).values({
      stationId: STATION_ID.ASSEMBLY_LINE,
      createdBy: req.body.user.id,
    });

    // Insert to order line
    await db.insert(orderLineSchema).values({
      orderId: newOrder[0].insertId,
      componentId: componentId,
      status: 'progress',
      quantity: 1,
    });

    // Insert to kanban
    const currentTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');
    const kanbanId = `${Math.random().toString(36).substr(2, 8)}-${Math.floor(Math.random() * 1E7)}`;

    const qrCodeContent = `${requestHost}/confirm-kanban/${kanbanId}`;
    const qrCode = await generateQR(qrCodeContent);

    const newKanban = await db.insert(kanbanSchema).values({
      id: kanbanId,
      cardId: 'RYIN002',
      type: 'withdrawal',
      status: 'progress',
      qrCode: qrCode,
      orderId: newOrder[0].insertId,
      orderDate: currentTime,
      planStart: currentTime,
      stationId: STATION_ID.ASSEMBLY_LINE,
    });
    if (newKanban[0].affectedRows === 0) {
      throw ApiErr('Failed to create kanban', 500);
    }

    // Insert to kanban withdrawal
    await db.insert(kanbanWithdrawalSchema).values({
      kanbanId: kanbanId,
      prevStationId: STATION_ID.ASSEMBLY_STORE,
      nextStationId: STATION_ID.ASSEMBLY_LINE,
    });

    res.json(apiResponse.success('Start assemble product success', null));

  } catch (error) {
    next(error);
  }
}

async function getAllKanbans(req: Request, res: Response, next: NextFunction) {
  try {
    const selectedWithdrawalColumns = {
      id: kanbanSchema.id,
      partName: componentSchema.name,
      quantity: orderLineSchema.quantity,
      planStart: kanbanSchema.planStart,
      status: kanbanSchema.status,
      cardId: kanbanSchema.cardId,
      type: kanbanSchema.type,
      orderId: kanbanSchema.orderId,
      stationName: stationSchema.name,
    };

    const kanbanWithdrawals = await db.select(selectedWithdrawalColumns).from(kanbanSchema)
      .innerJoin(kanbanWithdrawalSchema, eq(kanbanWithdrawalSchema.kanbanId, kanbanSchema.id))
      .innerJoin(orderSchema, eq(orderSchema.id, kanbanSchema.orderId))
      .innerJoin(orderLineSchema, eq(orderLineSchema.orderId, orderSchema.id))
      .innerJoin(componentSchema, eq(componentSchema.id, orderLineSchema.componentId))
      .innerJoin(stationSchema, eq(stationSchema.id, kanbanSchema.stationId))
      .where(eq(kanbanSchema.stationId, STATION_ID.ASSEMBLY_LINE))
      .orderBy(desc(kanbanSchema.createdAt));

    const selectedProductionColumns = {
      id: kanbanSchema.id,
      partNumber: partSchema.partNumber,
      partName: partSchema.partName,
      quantity: orderStoreSchema.quantity,
      planStart: kanbanSchema.planStart,
      status: kanbanSchema.status,
      cardId: kanbanSchema.cardId,
      type: kanbanSchema.type,
      orderId: kanbanSchema.orderId,
      stationName: stationSchema.name,
    };

    const kanbanProductions = await db.select(selectedProductionColumns).from(kanbanSchema)
      .innerJoin(orderSchema, eq(orderSchema.id, kanbanSchema.orderId))
      .innerJoin(orderStoreSchema, eq(orderStoreSchema.orderId, orderSchema.id))
      .innerJoin(partSchema, eq(partSchema.id, orderStoreSchema.partId))
      .innerJoin(stationSchema, eq(stationSchema.id, kanbanSchema.stationId))
      .where(eq(kanbanSchema.stationId, STATION_ID.ASSEMBLY_LINE))
      .orderBy(desc(kanbanSchema.createdAt));

    // Organize kanbans
    const kanbansData: KanbanFilterType = {
      queue: [],
      progress: [],
      done: [],
    };

    kanbanProductions.forEach((kanban) => {
      if (kanban.status === 'queue') {
        kanbansData.queue.push(kanban);
      }
    });

    kanbanWithdrawals.forEach((kanban) => {
      if (kanban.status === 'progress') {
        kanbansData.progress.push(kanban);
      } else if (kanban.status === 'done') {
        kanbansData.done.push(kanban);
      }
    });

    res.json(apiResponse.success('Kanbans retrieved successfully', kanbansData));
  } catch (error) {
    next(error);
  }
}

export default {
  getAllParts,
  getPartById,
  updatePartQuantity,
  createOrder,
  deleteOrderById,
  startAssembleComponent,
  getAllKanbans,
} satisfies AsmLineHandler;