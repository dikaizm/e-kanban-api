import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import apiResponse from '../../utils/api-response';
import progressTrackService from './progress-track.service';
import { db } from '../../db';
import { partSchema, partShopFloorSchema } from '../../models/part.model';
import { orderFabricationSchema } from '../../models/order.model';
import { eq, inArray, desc } from 'drizzle-orm';

interface StatsHandler {
  getProgressTrack: HandlerFunction;
  getProductionProgress: HandlerFunction;
  getDelayOntime: HandlerFunction;
}

async function getProgressTrack(req: Request, res: Response, next: NextFunction) {
  try {
    const progressData = {
      assemblyLine: 0,
      assemblyStore: 0,
      fabrication: 0,
    };

    // Get assembly line data

    // Get assembly store data
    progressData.assemblyStore = await progressTrackService.getAssemblyStoreProgress();

    // Get fabrication data
    progressData.fabrication = await progressTrackService.getFabricationProgress();

    res.json(apiResponse.success('Progress track data', progressData));

  } catch (error) {
    next(error);
  }
}

async function getProductionProgress(req: Request, res: Response, next: NextFunction) {
  try {
    // Get shop floors data in progress
    const selectedColumn = { partName: partSchema.partName, partNumber: partSchema.partNumber, station: partShopFloorSchema.station };

    const shopFloors = await db.select(selectedColumn).from(partShopFloorSchema).innerJoin(partSchema, eq(partSchema.id, partShopFloorSchema.partId)).where(eq(partShopFloorSchema.status, 'in_progress')).orderBy(desc(partShopFloorSchema.createdAt));

    res.json(apiResponse.success('Production progress data', shopFloors));

  } catch (error) {
    next(error);
  }
}

async function getDelayOntime(req: Request, res: Response, next: NextFunction) {
  try {
    const shopFloors = await db.select().from(partShopFloorSchema).where(eq(partShopFloorSchema.status, 'finish'));

    // Collect order ids from shop floors
    const orderIds = shopFloors.map((shopFloor) => shopFloor.orderId);

    // Get order fabrication quantity
    const orderFabrications = await db.select().from(orderFabricationSchema).where(inArray(orderFabricationSchema.orderId, orderIds));

    // Get order fabrication quantity
    const totalQuantity = orderFabrications.reduce((acc, order) => acc + order.quantity, 0);

    // Add time remaining and quantity to shop floors
    const processedShopFloors = shopFloors.map((shopFloorData: any) => {
      const planFinish = shopFloorData.planFinish ? new Date(shopFloorData.planFinish).getTime() : null;
      const actualFinish = shopFloorData.actualFinish ? new Date(shopFloorData.actualFinish).getTime() : null;

      let timeRemaining = null;
      if (planFinish && actualFinish) {
        timeRemaining = planFinish - actualFinish;
      }

      const quantity = orderFabrications.find((order) => order.orderId === shopFloorData.orderId)?.quantity || 0;

      return { ...shopFloorData, timeRemaining, quantity };
    });

    // Count quantity that has time remaining negative
    const delayQuantity = processedShopFloors.filter((shopFloor) => shopFloor.timeRemaining < 0).reduce((acc, shopFloor) => acc + shopFloor.quantity, 0);

    // Count quantity that has time remaining positive
    const ontimeQuantity = processedShopFloors.filter((shopFloor) => shopFloor.timeRemaining >= 0).reduce((acc, shopFloor) => acc + shopFloor.quantity, 0);

    res.json(apiResponse.success('Delay ontime data', { delayQuantity, ontimeQuantity, totalQuantity }));

  } catch (error) {
    next(error);
  }
}

export default {
  getProgressTrack,
  getProductionProgress,
  getDelayOntime,
} satisfies StatsHandler;