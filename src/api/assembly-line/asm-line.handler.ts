import apiResponse from '../../utils/api-response';
import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import { db } from '../../db';
import { partSchema, partStoreSchema } from '../../models/part.model';
import { eq } from 'drizzle-orm';
import { orderSchema, orderStoreSchema } from '../../models/order.model';
import { STATION_ID } from '../../const/global.const';

interface AsmLineHandler {
  getAllParts: HandlerFunction;
  createOrder: HandlerFunction;
}

const PART_STATUS = {
  COMPLETE: 'Complete',
  INCOMPLETE: 'Incomplete',
};

async function getAllParts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parts = await db.select().from(partSchema);

    const partStatus = parts.every((part) => part.quantity === part.quantityReq)
      ? PART_STATUS.COMPLETE
      : PART_STATUS.INCOMPLETE;

    res.json(apiResponse.success('Parts retrieved successfully', { parts, partStatus }));
  } catch (error) {
    next(error);
  }
}

async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { partNumber, quantity } = req.body;

    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const parts = await db.select().from(partSchema).where(eq(partSchema.partNumber, partNumber));
    if (parts.length === 0) {
      throw new Error('Part not found');
    }

    const part = parts[0];

    // Insert to order
    const order = await db.insert(orderSchema).values({
      stationId: STATION_ID.ASSEMBLY_LINE,
      createdBy: req.body.user.id,
    });

    // Check part stock in store
    const partStore = await db.select().from(partStoreSchema).where(eq(partStoreSchema.partId, part.id)).limit(1);
    if (partStore.length === 0) {
      // Insert to part store
      await db.insert(partStoreSchema).values({
        partId: part.id,
        stock: 0,
      });
    }

    // Insert to order store
    await db.insert(orderStoreSchema).values({
      orderId: order[0].insertId,
      partId: part.id,
      quantity: quantity,
      status: (partStore[0].stock >= quantity) ? 'deliver' : 'pending',
    });

    res.json(apiResponse.success('Order created successfully', null));
  } catch (error) {
    next(error);
  }
}

export default {
  getAllParts,
  createOrder,
} satisfies AsmLineHandler;