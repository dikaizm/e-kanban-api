import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import apiResponse from '../../utils/api-response';
import { db } from '../../db';
import { kanbanSchema, kanbanWithdrawalSchema } from '../../models/kanban.model';
import { eq, inArray } from 'drizzle-orm';
import { orderFabricationSchema, orderLineSchema, orderSchema, orderStoreSchema } from '../../models/order.model';
import { componentSchema, partComponentSchema, partSchema, partShopFloorSchema } from '../../models/part.model';
import { ApiErr } from '../../utils/api-error';
import { STATION_ID } from '../../const';
import { stationSchema } from '../../models/station.model';
import { getStationName } from '../../utils/qr-code';

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

    const kanban = await db.select({
      id: kanbanSchema.id,
      type: kanbanSchema.type,
      cardId: kanbanSchema.cardId,
      status: kanbanSchema.status,
      qrCode: kanbanSchema.qrCode,
      orderId: kanbanSchema.orderId,
      orderDate: kanbanSchema.orderDate,
      finishDate: kanbanSchema.finishDate,
      planStart: kanbanSchema.planStart,
      stationId: kanbanSchema.stationId,
      stationName: stationSchema.name,
    }).from(kanbanSchema)
      .innerJoin(stationSchema, eq(stationSchema.id, kanbanSchema.stationId))
      .where(eq(kanbanSchema.id, id))
      .limit(1);
    if (kanban.length === 0) {
      throw ApiErr('Kanban not found', 404);
    }

    const kanbanData: KanbanType = kanban[0];

    if (kanbanData.type === 'withdrawal') {
      const kanbanWithdrawal = await db.select().from(kanbanWithdrawalSchema)
        .where(eq(kanbanWithdrawalSchema.kanbanId, kanbanData.id)).limit(1);
      if (kanbanWithdrawal.length === 0) {
        throw ApiErr('Kanban withdrawal not found', 404);
      }

      kanbanData.prevStation = getStationName(kanbanWithdrawal[0].prevStationId);
      kanbanData.nextStation = getStationName(kanbanWithdrawal[0].nextStationId);

      const orderLine = await db.select({
        quantity: orderLineSchema.quantity,
        componentName: componentSchema.name,
        componentId: orderLineSchema.componentId,
      }).from(orderLineSchema)
        .innerJoin(componentSchema, eq(componentSchema.id, orderLineSchema.componentId))
        .where(eq(orderLineSchema.orderId, kanbanData.orderId)).limit(1);
      if (orderLine.length === 0) {
        throw ApiErr('Order line not found', 404);
      }

      kanbanData.partName = orderLine[0].componentName;
      kanbanData.quantity = orderLine[0].quantity;

      // Get part numbers based on component id
      const partComponents = await db.select().from(partComponentSchema).where(eq(partComponentSchema.componentId, orderLine[0].componentId));
      if (partComponents.length === 0) {
        throw ApiErr('Part component not found', 404);
      }

      const partIds = partComponents.map((partComponent: any) => partComponent.partId);
      const parts = await db.select().from(partSchema).where(inArray(partSchema.id, partIds));
      if (parts.length === 0) {
        throw ApiErr('Part not found', 404);
      }

      kanbanData.partNumber = parts.map((part: any) => part.partNumber);

    } else {
      const orderStore = await db.select().from(orderStoreSchema).where(eq(orderStoreSchema.orderId, kanbanData.orderId)).limit(1);
      if (orderStore.length === 0) {
        throw ApiErr('Order not found', 404);
      }

      if (kanbanData.stationId !== STATION_ID.ASSEMBLY_LINE) {
        // Get parts data
        const shopFloor = await db.select().from(partShopFloorSchema).where(eq(partShopFloorSchema.orderId, kanbanData.orderId)).limit(1);
        if (shopFloor.length === 0) {
          throw ApiErr('Part shop floor not found', 404);
        }

        kanbanData.planStart = shopFloor[0].planStart;
        kanbanData.finishDate = shopFloor[0].actualFinish;
      }

      const part = await db.select().from(partSchema).where(eq(partSchema.id, orderStore[0].partId)).limit(1);
      if (part.length === 0) {
        throw ApiErr('Part not found', 404);
      }

      kanbanData.quantity = orderStore[0].quantity;
      kanbanData.partName = part[0].partName;
      kanbanData.partNumber = [part[0].partNumber];
    }

    res.json(apiResponse.success('Kanban retrieved successfully', kanbanData));

  } catch (error) {
    next(error);
  }
}

async function handleQueueStatus(status: string, orderData: any, shopFloorData: any, currentTime: string) {
  if (status !== 'progress') {
    throw ApiErr('Kanban status can only be changed to progress', 400);
  }

  if (orderData.stationId === STATION_ID.ASSEMBLY_LINE) {
    // TODO: Implement logic for assembly line kanban
  } else {
    if (!shopFloorData.planFinish || !shopFloorData.planStart) {
      throw ApiErr('Plan start and plan finish are required, set it in Shop Floor', 400);
    }

    await db.update(partShopFloorSchema)
      .set({ status: 'in_progress', actualStart: currentTime })
      .where(eq(partShopFloorSchema.orderId, orderData.id));
  }
}

async function handleProgressStatus(status: string, orderData: any, shopFloorData: any, currentTime: string) {
  if (status !== 'done') {
    throw ApiErr('Kanban status can only be changed to done', 400);
  }

  if (orderData.stationId === STATION_ID.ASSEMBLY_LINE) {
    // TODO: Implement logic for assembly line kanban
    await db.update(kanbanSchema).set({ finishDate: currentTime }).where(eq(kanbanSchema.orderId, orderData.id));

  } else {
    if (shopFloorData.status !== 'in_progress') {
      throw ApiErr('Part shop floor status must be in progress', 400);
    }

    await db.update(partShopFloorSchema)
      .set({ status: 'finish', actualFinish: currentTime })
      .where(eq(partShopFloorSchema.orderId, orderData.id));

    const result = await db.update(orderFabricationSchema)
      .set({ status: 'deliver' })
      .where(eq(orderFabricationSchema.orderId, shopFloorData.orderId));

    if (!result[0].affectedRows) {
      throw ApiErr('Order not found', 404);
    }
  }
}

async function updateKanbanStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      throw ApiErr('Kanban ID and status are required', 400);
    }

    const kanban = await db.select().from(kanbanSchema).where(eq(kanbanSchema.id, id)).limit(1);
    if (!kanban.length) {
      throw ApiErr('Kanban not found', 404);
    }
    const kanbanData = kanban[0];

    const order = await db.select().from(orderSchema).where(eq(orderSchema.id, kanbanData.orderId)).limit(1);
    if (!order.length) {
      throw ApiErr('Order not found', 404);
    }
    const orderData = order[0];

    let shopFloorData;
    if (orderData.stationId === STATION_ID.FABRICATION) {
      const partShopFloor = await db.select().from(partShopFloorSchema).where(eq(partShopFloorSchema.orderId, orderData.id)).limit(1);
      if (!partShopFloor.length) {
        throw ApiErr('Part shop floor not found', 404);
      }
      shopFloorData = partShopFloor[0];

      const isStatusSynced = (
        (kanbanData.status === 'queue' && shopFloorData.status === 'pending') ||
        (kanbanData.status === 'progress' && shopFloorData.status === 'in_progress') ||
        (kanbanData.status === 'done' && shopFloorData.status === 'finish')
      );
      if (!isStatusSynced) {
        throw ApiErr('Kanban status is not synced with Shop Floor status', 400);
      }
    }

    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (kanbanData.status === status) {
      throw ApiErr('Kanban status is already the same', 400);
    }

    switch (kanbanData.status) {
      case 'queue':
        await handleQueueStatus(status, orderData, shopFloorData, currentTime);
        break;
      case 'progress':
        await handleProgressStatus(status, orderData, shopFloorData, currentTime);
        break;
      default:
        throw ApiErr('Kanban status cannot be changed', 400);
    }

    await db.update(kanbanSchema).set({ status }).where(eq(kanbanSchema.id, id));

    res.json(apiResponse.success('Kanban status updated successfully', null));
  } catch (error) {
    console.error(error);
    next(error);
  }
}

export default {
  getKanbanById,
  updateKanbanStatus,
} satisfies KanbanHandler;