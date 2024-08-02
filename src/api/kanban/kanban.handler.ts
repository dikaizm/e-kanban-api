import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import apiResponse from '../../utils/api-response';
import { db } from '../../db';
import { kanbanSchema, kanbanWithdrawalSchema } from '../../models/kanban.model';
import { eq } from 'drizzle-orm';
import { orderFabricationSchema, orderSchema } from '../../models/order.model';
import { partSchema, partShopFloorSchema } from '../../models/part.model';
import { ApiErr } from '../../utils/api-error';
import { STATION_ID } from '../../const/global.const';

interface KanbanHandler {
  getKanbanById: HandlerFunction;
  updateKanbanStatus: HandlerFunction;
}

interface KanbanType {
  [key: string]: any
}

async function getKanbanById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw ApiErr('Kanban ID is required', 400);
    }

    const kanban = await db.select().from(kanbanSchema).where(eq(kanbanSchema.id, id)).limit(1);
    if (kanban.length === 0) {
      throw ApiErr('Kanban not found', 404);
    }

    const kanbanData: KanbanType = kanban[0];

    if (kanbanData.type === 'withdrawal') {
      const kanbanWithdrawal = await db
        .select()
        .from(kanbanWithdrawalSchema)
        .where(eq(kanbanWithdrawalSchema.kanbanId, id))
        .limit(1);
      if (kanbanWithdrawal.length === 0) {
        throw ApiErr('Kanban withdrawal not found', 404);
      }

      kanbanData.withdrawal = kanbanWithdrawal[0];
    } else {
      // Get parts data
      const orderStore = await db.select().from(orderFabricationSchema).where(eq(orderFabricationSchema.orderId, kanbanData.orderId)).limit(1);
      if (orderStore.length === 0) {
        throw ApiErr('Order not found', 404);
      }

      const shopFloor = await db.select().from(partShopFloorSchema).where(eq(partShopFloorSchema.orderId, kanbanData.orderId)).limit(1);
      if (shopFloor.length === 0) {
        throw ApiErr('Part shop floor not found', 404);
      }

      const part = await db.select().from(partSchema).where(eq(partSchema.id, orderStore[0].partId)).limit(1);
      if (part.length === 0) {
        throw ApiErr('Part not found', 404);
      }

      kanbanData.planStart = shopFloor[0].planStart;
      kanbanData.finishDate = shopFloor[0].actualFinish;
      kanbanData.quantity = orderStore[0].quantity;
      kanbanData.partName = part[0].partName;
      kanbanData.partNumber = part[0].partNumber;
    }

    res.json(apiResponse.success('Kanban retrieved successfully', kanbanData));

  } catch (error) {
    next(error);
  }
}

async function updateKanbanStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      throw ApiErr('Kanban ID and status are required', 400);
    }

    const kanban = await db.select().from(kanbanSchema).where(eq(kanbanSchema.id, id)).limit(1);
    if (kanban.length === 0) {
      throw ApiErr('Kanban not found', 404);
    }
    const kanbanData = kanban[0];

    const order = await db.select().from(orderSchema).where(eq(orderSchema.id, kanbanData.orderId)).limit(1);
    if (order.length === 0) {
      throw ApiErr('Order not found', 404);
    }
    const orderData = order[0];

    const partShopFloor = await db.select().from(partShopFloorSchema).where(eq(partShopFloorSchema.orderId, orderData.id)).limit(1);
    if (partShopFloor.length === 0) {
      throw ApiErr('Part shop floor not found', 404);
    }
    const shopFloorData = partShopFloor[0];

    if (!((kanbanData.status === 'queue' && shopFloorData.status === 'pending') ||
      (kanbanData.status === 'progress' && shopFloorData.status === 'in_progress') ||
      (kanbanData.status === 'done' && shopFloorData.status === 'finish'))) {
      throw ApiErr('Kanban status is not synced with Shop Floor status', 400);
    }

    const currentTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');

    if (kanbanData.status === status) {
      throw ApiErr('Kanban status is already the same', 400);

    } else if (kanbanData.status === 'queue') {

      // QUEUE
      if (status !== 'progress') {
        throw ApiErr('Kanban status can only be changed to progress', 400);
      }

      if (orderData.stationId === STATION_ID.ASSEMBLY_LINE) {
        // TODO: Implement logic for assembly line kanban

      } else {
        if (!shopFloorData.planFinish || !shopFloorData.planStart) {
          throw ApiErr('Plan start and plan finish are required, set it in Shop Floor', 400);
        }

        await db.update(partShopFloorSchema).set({ status: 'in_progress', actualStart: currentTime }).where(eq(partShopFloorSchema.orderId, orderData.id));
      }

    } else if (kanbanData.status === 'progress') {

      // PROGRESS
      if (status !== 'done') {
        throw ApiErr('Kanban status can only be changed to done', 400);
      }

      if (orderData.stationId === STATION_ID.ASSEMBLY_LINE) {
        // TODO: Implement logic for assembly line kanban

      } else {
        if (shopFloorData.status !== 'in_progress') {
          throw ApiErr('Part shop floor status must be in progress', 400);
        }

        await db.update(partShopFloorSchema).set({ status: 'finish', actualFinish: currentTime }).where(eq(partShopFloorSchema.orderId, orderData.id));

        // change order status to deliver
        const result = await db.update(orderFabricationSchema)
          .set({ status: 'deliver' })
          .where(eq(orderFabricationSchema.orderId, shopFloorData.orderId));

        if (result[0].affectedRows === 0) {
          res.status(404).json(apiResponse.error('Order not found'));
          return;
        }
      }

    } else {
      throw ApiErr('Kanban status cannot be changed', 400);
    }

    await db.update(kanbanSchema).set({ status }).where(eq(kanbanSchema.id, id));

    res.json(apiResponse.success('Kanban status updated successfully', null));

  } catch (error) {
    next(error);
  }
}

export default {
  getKanbanById,
  updateKanbanStatus,
} satisfies KanbanHandler;