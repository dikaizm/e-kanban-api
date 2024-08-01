import { inArray } from 'drizzle-orm';
import { db } from '../../db';
import { orderFabricationSchema, orderStoreSchema } from '../../models/order.model';
import { partShopFloorSchema } from '../../models/part.model';

interface StatsProgressTrackService {
  getAssemblyLineProgress: () => Promise<number>;
  getAssemblyStoreProgress: () => Promise<number>;
  getFabricationProgress: () => Promise<number>;
}

async function getAssemblyLineProgress() {
  return 0;
}

async function getAssemblyStoreProgress() {
  // Get order store data
  const orderStores = await db.select().from(orderStoreSchema);

  // Count orders that doesn't have certain status
  const progressOrderQuantity = orderStores.filter((order) => order.status !== 'pending').reduce((acc, order) => acc + order.quantity, 0);

  // Count total order quantity
  const totalOrderQuantity = orderStores.reduce((acc, order) => acc + order.quantity, 0);

  return Math.floor((progressOrderQuantity / totalOrderQuantity) * 100);
}

async function getFabricationProgress() {
  // Get order and shop floor data
  const orderFabrications = await db.select().from(orderFabricationSchema);

  // Collect order ids from order fabrication
  const orderIds = orderFabrications.map((order) => order.orderId);

  // Get order and match it with shop floor data that has the same order_id
  const shopFloors = await db.select().from(partShopFloorSchema).where(inArray(partShopFloorSchema.orderId, orderIds));

  // Filter shio floor data with status 'in_progress'
  const orderProgressShopFloors = shopFloors.filter((shopFloor) => shopFloor.status === 'in_progress').map((shopFloor) => shopFloor.orderId);

  const progressOrderQuantity = orderFabrications.filter((order) => orderProgressShopFloors.includes(order.orderId)).reduce((acc, order) => acc + order.quantity, 0);

  const totalOrderQuantity = orderFabrications.reduce((acc, order) => acc + order.quantity, 0);

  // Calculate the progress (shop floor with status 'in_progress' / total order quantity * 100)
  return Math.floor((progressOrderQuantity / totalOrderQuantity) * 100);
}

export default {
  getAssemblyLineProgress,
  getAssemblyStoreProgress,
  getFabricationProgress,
} satisfies StatsProgressTrackService;