import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import apiResponse from '../../utils/api-response';
import { db } from '../../db';
import { kanbanSchema, kanbanWithdrawalSchema } from '../../models/kanban.model';
import { eq } from 'drizzle-orm';
import { orderFabricationSchema } from '../../models/order.model';
import { partSchema } from '../../models/part.model';

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
      res.status(400).json(apiResponse.error('Kanban ID is required'));
      return;
    }

    const kanban = await db.select().from(kanbanSchema).where(eq(kanbanSchema.id, id)).limit(1);
    if (kanban.length === 0) {
      res.status(404).json(apiResponse.error('Kanban not found'));
      return;
    }

    const kanbanData: KanbanType = kanban[0];

    if (kanbanData.type === 'withdrawal') {
      const kanbanWithdrawal = await db
        .select()
        .from(kanbanWithdrawalSchema)
        .where(eq(kanbanWithdrawalSchema.kanbanId, id))
        .limit(1);
      if (kanbanWithdrawal.length === 0) {
        res.status(404).json(apiResponse.error('Kanban withdrawal not found'));
        return;
      }

      kanbanData.withdrawal = kanbanWithdrawal[0];
    } else {
      // Get parts data
      const orderStore = await db.select().from(orderFabricationSchema).where(eq(orderFabricationSchema.orderId, kanbanData.orderId)).limit(1);
      if (orderStore.length === 0) {
        res.status(404).json(apiResponse.error('Order not found'));
        return;
      }

      const part = await db.select().from(partSchema).where(eq(partSchema.id, orderStore[0].partId)).limit(1);
      if (part.length === 0) {
        res.status(404).json(apiResponse.error('Part not found'));
        return;
      }

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

  } catch (error) {
    next(error);
  }
}

export default {
  getKanbanById,
  updateKanbanStatus,
} satisfies KanbanHandler;