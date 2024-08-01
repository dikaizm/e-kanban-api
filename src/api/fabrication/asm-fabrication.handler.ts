import { NextFunction, Request, Response } from 'express';
import HandlerFunction from '../../utils/handler-function';
import { db } from '../../db';
import { desc, eq } from 'drizzle-orm';
import { deliverOrderFabricationSchema, orderFabricationSchema, orderSchema } from '../../models/order.model';
import apiResponse from '../../utils/api-response';
import { partSchema, partShopFloorSchema, partStoreSchema } from '../../models/part.model';
import { KANBAN_ID, STATION_ID } from '../../const/global.const';
import { kanbanSchema } from '../../models/kanban.model';

interface AsmFabricationHandler {
  getAllOrders: HandlerFunction;
  deliverOrder: HandlerFunction;

  getAllShopFloors: HandlerFunction;
  getShopFloorById: HandlerFunction;
  editPlanShopFloor: HandlerFunction;
  updateStatusShopFloor: HandlerFunction;

  getAllKanbans: HandlerFunction;
}

async function getAllOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await db.select().from(orderFabricationSchema).innerJoin(partSchema, eq(partSchema.id, orderFabricationSchema.partId)).orderBy(desc(orderFabricationSchema.createdAt));

    const ordersData = orders.map((item) => {
      const order = item.orders_fabrication;
      const part = item.parts;

      return {
        ...order,
        kanbanId: KANBAN_ID.PRODUCTION,
        partNumber: part.partNumber,
        partName: part.partName,
      };
    });

    res.json(apiResponse.success('Orders retrieved successfully', ordersData));
  } catch (error) {
    next(error);
  }
}

async function deliverOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      res.status(400).json(apiResponse.error('Order ID is required'));
      return;
    }

    const orderIdInt = parseInt(orderId, 10);
    if (isNaN(orderIdInt)) {
      res.status(400).json(apiResponse.error('Invalid Order ID'));
      return;
    }

    const orderFabrication = await db.select().from(orderFabricationSchema).where(eq(orderFabricationSchema.id, orderIdInt)).limit(1);
    if (!orderFabrication) {
      res.status(404).json(apiResponse.error('Order not found'));
      return;
    }

    // Update order station
    await db.update(orderSchema).set({ stationId: STATION_ID.ASSEMBLY_STORE }).where(eq(orderSchema.id, orderFabrication[0].orderId));

    // Update the order fab status
    await db.update(orderFabricationSchema)
      .set({ status: 'finish' })
      .where(eq(orderFabricationSchema.id, orderIdInt));

    // Insert to deliver order fabrication
    await db.insert(deliverOrderFabricationSchema).values({
      orderId: orderFabrication[0].orderId,
      partId: orderFabrication[0].partId,
      status: 'deliver',
    });

    // Update part status in part store
    const partStore = await db.select().from(partStoreSchema).where(eq(partStoreSchema.partId, orderFabrication[0].partId)).limit(1);
    if (!partStore) {
      res.status(404).json(apiResponse.error('Part not found in assembly store'));
      return;
    }
    await db.update(partStoreSchema).set({ status: 'receive' }).where(eq(partStoreSchema.partId, orderFabrication[0].partId));

    res.json(apiResponse.success('Order delivered successfully', null));
  } catch (error) {
    next(error);
  }
}

async function getAllShopFloors(req: Request, res: Response, next: NextFunction) {
  try {
    const shopFloors = await db.select().from(partShopFloorSchema).innerJoin(partSchema, eq(partSchema.id, partShopFloorSchema.partId)).orderBy(desc(partShopFloorSchema.createdAt));

    const shopFloorsData: any = shopFloors.map((item) => {
      const shopFloor = item.parts_shop_floor;
      const part = item.parts;

      return {
        ...shopFloor,
        partNumber: part.partNumber,
        partName: part.partName,
      };
    });

    shopFloorsData.forEach((shopFloorData: any) => {
      shopFloorData.timeRemaining = null;
      const planFinish = shopFloorData.planFinish ? new Date(shopFloorData.planFinish).getTime() : null;
      const actualFinish = shopFloorData.actualFinish ? new Date(shopFloorData.actualFinish).getTime() : null;

      if (planFinish && actualFinish) {
        shopFloorData.timeRemaining = planFinish - actualFinish;
      }
    });

    res.json(apiResponse.success('Shop floors retrieved successfully', shopFloorsData));
  } catch (error) {
    next(error);
  }
}

async function getShopFloorById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json(apiResponse.error('Shop floor ID is required'));
      return;
    }

    const shopFloorId = parseInt(id, 10);
    if (isNaN(shopFloorId)) {
      res.status(400).json(apiResponse.error('Invalid Shop floor ID'));
      return;
    }

    const shopFloor = await db.select().from(partShopFloorSchema).innerJoin(partSchema, eq(partSchema.id, partShopFloorSchema.partId)).where(eq(partShopFloorSchema.id, shopFloorId)).limit(1);
    if (!shopFloor) {
      res.status(404).json(apiResponse.error('Shop floor not found'));
      return;
    }

    const part = shopFloor[0].parts;
    const shopFloorData = {
      ...shopFloor[0].parts_shop_floor,
      partNumber: part.partNumber,
      partName: part.partName,
    };

    res.json(apiResponse.success('Shop floor retrieved successfully', shopFloorData));
  } catch (error) {
    next(error);
  }
}

async function editPlanShopFloor(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, planStart, planFinish } = req.body;
    if (!id || !planStart || !planFinish) {
      res.status(400).json(apiResponse.error('Order ID, Plan Start, and Plan Finish are required'));
      return;
    }

    const shopFloorId = parseInt(id, 10);
    if (isNaN(shopFloorId)) {
      res.status(400).json(apiResponse.error('Invalid Order ID'));
      return;
    }

    const startDate = new Date(planStart);
    const finishDate = new Date(planFinish);

    // Check if date inputs are valid
    if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
      res.status(400).json(apiResponse.error('Invalid date format for Plan Start or Plan Finish'));
      return;
    }

    // Ensure planStart is earlier than planFinish
    if (startDate >= finishDate) {
      res.status(400).json(apiResponse.error('Plan Start cannot be later than or equal to Plan Finish'));
      return;
    }

    const result = await db.update(partShopFloorSchema)
      .set({
        planStart: planStart,
        planFinish: planFinish,
      })
      .where(eq(partShopFloorSchema.id, shopFloorId));

    if (result[0].affectedRows === 0) {
      res.status(404).json(apiResponse.error('Order not found'));
      return;
    }

    res.json(apiResponse.success('Shop floor plan updated successfully', null));
  } catch (error) {
    next(error);
  }
}

type UpdateStatusShopFloorRequest = {
  id: string;
  status: 'pending' | 'in_progress' | 'finish';
};

type UpdatedShopFloorData = {
  status: 'pending' | 'in_progress' | 'finish';
  actualStart?: string;
  actualFinish?: string;
};

async function updateStatusShopFloor(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, status }: UpdateStatusShopFloorRequest = req.body;
    if (!id || !status) {
      res.status(400).json(apiResponse.error('Order ID and Status are required'));
      return;
    }
    if (!['pending', 'in_progress', 'finish'].includes(status)) {
      res.status(400).json(apiResponse.error('Invalid Status'));
      return;
    }

    const shopFloorId = parseInt(id, 10);
    if (isNaN(shopFloorId)) {
      res.status(400).json(apiResponse.error('Invalid Order ID'));
      return;
    }

    // Check if theres a plan start and finish
    const shopFloor = await db.select().from(partShopFloorSchema).where(eq(partShopFloorSchema.id, shopFloorId)).limit(1);
    if (!shopFloor) {
      res.status(404).json(apiResponse.error('Shop floor not found'));
      return;
    }

    if (!shopFloor[0].planStart || !shopFloor[0].planFinish) {
      res.status(400).json(apiResponse.error('Plan Start and Plan Finish are required'));
      return;
    }

    const currentTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');

    const updatedData: UpdatedShopFloorData = { status };
    if (status === 'in_progress') {
      updatedData.actualStart = currentTime;
    } else if (status === 'finish') {
      updatedData.actualFinish = currentTime;
    }

    // Update status
    await db.update(partShopFloorSchema)
      .set(updatedData)
      .where(eq(partShopFloorSchema.id, shopFloor[0].id));

    // If status is finish, change order status to deliver
    if (status === 'finish') {
      const result = await db.update(orderFabricationSchema)
        .set({ status: 'deliver' })
        .where(eq(orderFabricationSchema.orderId, shopFloor[0].orderId));

      if (result[0].affectedRows === 0) {
        res.status(404).json(apiResponse.error('Order not found'));
        return;
      }
    }

    res.json(apiResponse.success('Shop floor status updated successfully', null));
  } catch (error) {
    next(error);
  }
}

async function getAllKanbans(req: Request, res: Response, next: NextFunction) {
  try {
    const kanbans = await db.select().from(kanbanSchema);
    res.json(apiResponse.success('Kanbans retrieved successfully', kanbans));
  } catch (error) {
    next(error);
  }
}

export default {
  getAllOrders,
  deliverOrder,

  getAllShopFloors,
  getShopFloorById,
  editPlanShopFloor,
  updateStatusShopFloor,

  getAllKanbans,
} satisfies AsmFabricationHandler;