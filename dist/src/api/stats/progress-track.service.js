"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const order_model_1 = require("../../models/order.model");
const part_model_1 = require("../../models/part.model");
async function getAssemblyLineProgress() {
    return 0;
}
async function getAssemblyStoreProgress() {
    // Get order store data
    const orderStores = await db_1.db.select().from(order_model_1.orderStoreSchema);
    // Count orders that doesn't have certain status
    const progressOrderQuantity = orderStores.filter((order) => order.status !== 'pending').reduce((acc, order) => acc + order.quantity, 0);
    // Count total order quantity
    const totalOrderQuantity = orderStores.reduce((acc, order) => acc + order.quantity, 0);
    return Math.floor((progressOrderQuantity / totalOrderQuantity) * 100);
}
async function getFabricationProgress() {
    // Get order and shop floor data
    const orderFabrications = await db_1.db.select().from(order_model_1.orderFabricationSchema);
    // Collect order ids from order fabrication
    const orderIds = orderFabrications.map((order) => order.orderId);
    // Get order and match it with shop floor data that has the same order_id
    const shopFloors = await db_1.db.select().from(part_model_1.partShopFloorSchema).where((0, drizzle_orm_1.inArray)(part_model_1.partShopFloorSchema.orderId, orderIds));
    // Filter shio floor data with status 'in_progress'
    const orderProgressShopFloors = shopFloors.filter((shopFloor) => shopFloor.status === 'in_progress').map((shopFloor) => shopFloor.orderId);
    const progressOrderQuantity = orderFabrications.filter((order) => orderProgressShopFloors.includes(order.orderId)).reduce((acc, order) => acc + order.quantity, 0);
    const totalOrderQuantity = orderFabrications.reduce((acc, order) => acc + order.quantity, 0);
    // Calculate the progress (shop floor with status 'in_progress' / total order quantity * 100)
    return Math.floor((progressOrderQuantity / totalOrderQuantity) * 100);
}
exports.default = {
    getAssemblyLineProgress,
    getAssemblyStoreProgress,
    getFabricationProgress,
};
//# sourceMappingURL=progress-track.service.js.map