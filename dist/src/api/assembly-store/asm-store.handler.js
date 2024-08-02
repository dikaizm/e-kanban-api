"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_response_1 = __importDefault(require("../../utils/api-response"));
const db_1 = require("../../db");
const order_model_1 = require("../../models/order.model");
const drizzle_orm_1 = require("drizzle-orm");
const part_model_1 = require("../../models/part.model");
const global_const_1 = require("../../const/global.const");
const kanban_model_1 = require("../../models/kanban.model");
const qr_code_1 = require("../../utils/qr-code");
const api_error_1 = require("../../utils/api-error");
async function getAllOrders(req, res, next) {
    try {
        const orders = await db_1.db
            .select()
            .from(order_model_1.orderStoreSchema)
            .innerJoin(part_model_1.partSchema, (0, drizzle_orm_1.eq)(part_model_1.partSchema.id, order_model_1.orderStoreSchema.partId))
            .orderBy((0, drizzle_orm_1.desc)(order_model_1.orderStoreSchema.createdAt));
        // Check if orders is empty
        if (orders.length === 0) {
            res.json(api_response_1.default.success('Orders retrieved successfully', []));
            return;
        }
        // Get part stock from part store
        const partStore = await db_1.db.select().from(part_model_1.partStoreSchema);
        // Rewrite order data to include part details
        const ordersData = orders.map((item) => {
            const order = item.orders_store;
            const part = item.parts;
            const partStock = partStore.find((stock) => stock.partId === part.id);
            return {
                ...order,
                kanbanId: global_const_1.KANBAN_ID.PRODUCTION,
                partNumber: part.partNumber,
                partName: part.partName,
                stock: partStock?.stock,
            };
        });
        res.json(api_response_1.default.success('Orders retrieved successfully', ordersData));
    }
    catch (error) {
        next(error);
    }
}
async function updateOrderStatus(req, res, next) {
    try {
        const { id, status } = req.body;
        if (!id || !status) {
            throw (0, api_error_1.ApiErr)('Invalid request', 400);
        }
        // Check if order store exists
        const orderStore = await db_1.db.select().from(order_model_1.orderStoreSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderStoreSchema.id, id)).limit(1);
        if (orderStore.length === 0) {
            throw (0, api_error_1.ApiErr)('Order not found', 404);
        }
        if (status !== 'production' && status !== 'deliver' && status !== 'finish') {
            throw (0, api_error_1.ApiErr)('Invalid status', 400);
        }
        // Update order status
        if (status === 'production') {
            // Update order store status to production
            await db_1.db.update(order_model_1.orderStoreSchema).set({ status: 'production' }).where((0, drizzle_orm_1.eq)(order_model_1.orderStoreSchema.id, id));
            // Update order station to fabrication
            await db_1.db.update(order_model_1.orderSchema).set({ stationId: global_const_1.STATION_ID.FABRICATION }).where((0, drizzle_orm_1.eq)(order_model_1.orderSchema.id, orderStore[0].orderId));
            // Insert order in order fabrication
            await db_1.db.insert(order_model_1.orderFabricationSchema).values({
                orderId: orderStore[0].orderId,
                partId: orderStore[0].partId,
                quantity: orderStore[0].quantity,
                status: 'pending',
            });
            // Insert to shop floor fabrication
            await db_1.db.insert(part_model_1.partShopFloorSchema).values({
                orderId: orderStore[0].orderId,
                partId: orderStore[0].partId,
                status: 'pending',
                station: 'shop_floor',
            });
            const currentTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');
            const kanbanId = `${Math.random().toString(36).substr(2, 8)}-${Math.floor(Math.random() * 1E7)}`;
            const requestHost = req.get('host');
            const qrCodeContent = `${requestHost}/confirm-kanban/${kanbanId}`;
            const qrCode = await (0, qr_code_1.generateQR)(qrCodeContent);
            await db_1.db.insert(kanban_model_1.kanbanSchema).values({
                id: kanbanId,
                type: 'production',
                cardId: 'RYIN001',
                status: 'queue',
                qrCode: qrCode,
                orderId: orderStore[0].orderId,
                orderDate: currentTime,
            });
            // Change part store status to order_to_fabrication
            await db_1.db.update(part_model_1.partStoreSchema).set({ status: 'order_to_fabrication' }).where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.partId, orderStore[0].partId));
            res.status(201).json(api_response_1.default.success('Order to production created successfully', null));
        }
        else if (status === 'deliver') {
            await db_1.db.update(order_model_1.orderStoreSchema).set({ status: 'finish' }).where((0, drizzle_orm_1.eq)(order_model_1.orderStoreSchema.id, id));
            // Get part
            const part = await db_1.db.select()
                .from(part_model_1.partSchema)
                .where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, orderStore[0].partId))
                .limit(1);
            if (!part.length) {
                throw (0, api_error_1.ApiErr)('Part not found', 404);
            }
            // Update quantity in parts
            await db_1.db.update(part_model_1.partSchema)
                .set({ quantity: part[0].quantity + orderStore[0].quantity })
                .where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, orderStore[0].partId));
            // Update quantity in part store
            const partStore = await db_1.db.select().from(part_model_1.partStoreSchema).where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.partId, orderStore[0].partId));
            if (!partStore.length) {
                throw (0, api_error_1.ApiErr)('Part store not found', 404);
            }
            await db_1.db.update(part_model_1.partStoreSchema)
                .set({ stock: partStore[0].stock - orderStore[0].quantity })
                .where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.id, partStore[0].id));
            res.json(api_response_1.default.success('Order has been delivered successfully', null));
        }
    }
    catch (error) {
        next(error);
    }
}
async function getAllParts(req, res, next) {
    try {
        const parts = await db_1.db.select().from(part_model_1.partStoreSchema).innerJoin(part_model_1.partSchema, (0, drizzle_orm_1.eq)(part_model_1.partSchema.id, part_model_1.partStoreSchema.partId)).orderBy((0, drizzle_orm_1.desc)(part_model_1.partStoreSchema.createdAt));
        const partsData = parts.map((item) => {
            const part = item.parts;
            const partStore = item.parts_store;
            return {
                ...partStore,
                partNumber: part.partNumber,
                partName: part.partName,
            };
        });
        res.json(api_response_1.default.success('Parts retrieved successfully', partsData));
    }
    catch (error) {
        next(error);
    }
}
async function updatePartStatus(req, res, next) {
    try {
        const { id, status } = req.body;
        if (!id || !status) {
            res.status(400).json(api_response_1.default.error('Invalid request, id and status are required'));
            return;
        }
        // Check if part store exists
        const partStore = await db_1.db.select().from(part_model_1.partStoreSchema).where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.id, id)).limit(1);
        if (partStore.length === 0) {
            res.status(404).json(api_response_1.default.error('Part not found'));
            return;
        }
        const currentStatus = partStore[0].status;
        if (currentStatus !== 'receive') {
            res.status(400).json(api_response_1.default.error('Part status is not receive'));
            return;
        }
        if (status !== 'idle') {
            res.status(400).json(api_response_1.default.error('Invalid status'));
            return;
        }
        // Get updated stock from deliver order fabrication where status is deliver
        const deliverOrders = await db_1.db.select().from(order_model_1.deliverOrderFabricationSchema).where((0, drizzle_orm_1.sql) `status = 'deliver' and part_id = ${partStore[0].partId}`);
        if (deliverOrders.length === 0) {
            res.status(404).json(api_response_1.default.error('No deliver order found'));
            return;
        }
        const deliverOrderIds = deliverOrders.map((item) => item.orderId);
        // Get quantity from order fabrication, use wherein
        const orderFabrications = await db_1.db.select().from(order_model_1.orderFabricationSchema).where((0, drizzle_orm_1.inArray)(order_model_1.orderFabricationSchema.orderId, deliverOrderIds));
        if (orderFabrications.length === 0) {
            res.status(404).json(api_response_1.default.error('No order fabrication found'));
            return;
        }
        // Count new stock
        const newStock = orderFabrications.reduce((acc, item) => acc + item.quantity, 0);
        // Update stock and part status
        await db_1.db.update(part_model_1.partStoreSchema).set({ status, stock: partStore[0].stock + newStock }).where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.id, id));
        // Update status deliver order to finish
        await db_1.db.update(order_model_1.deliverOrderFabricationSchema).set({ status: 'finish' }).where((0, drizzle_orm_1.inArray)(order_model_1.deliverOrderFabricationSchema.orderId, deliverOrderIds));
        // Check if order with this part ready to deliver
        const orderStore = await db_1.db.select().from(order_model_1.orderStoreSchema).where((0, drizzle_orm_1.inArray)(order_model_1.orderStoreSchema.orderId, deliverOrderIds));
        orderStore.forEach(async (order) => {
            if (order.quantity <= newStock) {
                await db_1.db.update(order_model_1.orderStoreSchema).set({ status: 'deliver' }).where((0, drizzle_orm_1.eq)(order_model_1.orderStoreSchema.id, order.id));
            }
        });
        res.json(api_response_1.default.success('Part received successfully', null));
    }
    catch (error) {
        next(error);
    }
}
exports.default = {
    getAllOrders,
    updateOrderStatus,
    getAllParts,
    updatePartStatus,
};
//# sourceMappingURL=asm-store.handler.js.map