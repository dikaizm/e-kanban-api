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
  startAssembleProduct: HandlerFunction;
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

async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { partNumber, quantity } = req.body;

    if (!quantity || quantity <= 0) {
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

    res.json(apiResponse.success('Order created successfully', null));
  } catch (error) {
    next(error);
  }
}

async function startAssembleProduct(req: Request, res: Response, next: NextFunction) {
  try {
    // Update each part quantity
    const parts = await db.select().from(partSchema);

    for (const part of parts) {
      await db.update(partSchema).set({ quantity: part.quantity - part.quantityReq }).where(eq(partSchema.id, part.id));
    }

    res.json(apiResponse.success('Start assemble product success', null));

  } catch (error) {
    next(error);
  }
}

export default {
  getAllParts,
  createOrder,
  startAssembleProduct,
} satisfies AsmLineHandler;