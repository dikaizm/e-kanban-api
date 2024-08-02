"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../db");
const drizzle_orm_1 = require("drizzle-orm");
const order_model_1 = require("../../models/order.model");
const api_response_1 = __importDefault(require("../../utils/api-response"));
const part_model_1 = require("../../models/part.model");
const global_const_1 = require("../../const/global.const");
const kanban_model_1 = require("../../models/kanban.model");
async function getAllOrders(req, res, next) {
    try {
        const orders = await db_1.db.select().from(order_model_1.orderFabricationSchema).innerJoin(part_model_1.partSchema, (0, drizzle_orm_1.eq)(part_model_1.partSchema.id, order_model_1.orderFabricationSchema.partId)).orderBy((0, drizzle_orm_1.desc)(order_model_1.orderFabricationSchema.createdAt));
        const ordersData = orders.map((item) => {
            const order = item.orders_fabrication;
            const part = item.parts;
            return {
                ...order,
                kanbanId: global_const_1.KANBAN_ID.PRODUCTION,
                partNumber: part.partNumber,
                partName: part.partName,
            };
        });
        res.json(api_response_1.default.success('Orders retrieved successfully', ordersData));
    }
    catch (error) {
        next(error);
    }
}
async function deliverOrder(req, res, next) {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            res.status(400).json(api_response_1.default.error('Order ID is required'));
            return;
        }
        const orderIdInt = parseInt(orderId, 10);
        if (isNaN(orderIdInt)) {
            res.status(400).json(api_response_1.default.error('Invalid Order ID'));
            return;
        }
        const orderFabrication = await db_1.db.select().from(order_model_1.orderFabricationSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderFabricationSchema.id, orderIdInt)).limit(1);
        if (!orderFabrication) {
            res.status(404).json(api_response_1.default.error('Order not found'));
            return;
        }
        // Update order station
        await db_1.db.update(order_model_1.orderSchema).set({ stationId: global_const_1.STATION_ID.ASSEMBLY_STORE }).where((0, drizzle_orm_1.eq)(order_model_1.orderSchema.id, orderFabrication[0].orderId));
        // Update the order fab status
        await db_1.db.update(order_model_1.orderFabricationSchema)
            .set({ status: 'finish' })
            .where((0, drizzle_orm_1.eq)(order_model_1.orderFabricationSchema.id, orderIdInt));
        // Insert to deliver order fabrication
        await db_1.db.insert(order_model_1.deliverOrderFabricationSchema).values({
            orderId: orderFabrication[0].orderId,
            partId: orderFabrication[0].partId,
            status: 'deliver',
        });
        // Update part status in part store
        const partStore = await db_1.db.select().from(part_model_1.partStoreSchema).where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.partId, orderFabrication[0].partId)).limit(1);
        if (!partStore) {
            res.status(404).json(api_response_1.default.error('Part not found in assembly store'));
            return;
        }
        await db_1.db.update(part_model_1.partStoreSchema).set({ status: 'receive' }).where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.partId, orderFabrication[0].partId));
        res.json(api_response_1.default.success('Order delivered successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function getAllShopFloors(req, res, next) {
    try {
        const shopFloors = await db_1.db.select().from(part_model_1.partShopFloorSchema).innerJoin(part_model_1.partSchema, (0, drizzle_orm_1.eq)(part_model_1.partSchema.id, part_model_1.partShopFloorSchema.partId)).orderBy((0, drizzle_orm_1.desc)(part_model_1.partShopFloorSchema.createdAt));
        const shopFloorsData = shopFloors.map((item) => {
            const shopFloor = item.parts_shop_floor;
            const part = item.parts;
            return {
                ...shopFloor,
                partNumber: part.partNumber,
                partName: part.partName,
            };
        });
        shopFloorsData.forEach((shopFloorData) => {
            shopFloorData.timeRemaining = null;
            const planFinish = shopFloorData.planFinish ? new Date(shopFloorData.planFinish).getTime() : null;
            const actualFinish = shopFloorData.actualFinish ? new Date(shopFloorData.actualFinish).getTime() : null;
            if (planFinish && actualFinish) {
                shopFloorData.timeRemaining = planFinish - actualFinish;
            }
        });
        res.json(api_response_1.default.success('Shop floors retrieved successfully', shopFloorsData));
    }
    catch (error) {
        next(error);
    }
}
async function getShopFloorById(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json(api_response_1.default.error('Shop floor ID is required'));
            return;
        }
        const shopFloorId = parseInt(id, 10);
        if (isNaN(shopFloorId)) {
            res.status(400).json(api_response_1.default.error('Invalid Shop floor ID'));
            return;
        }
        const shopFloor = await db_1.db.select().from(part_model_1.partShopFloorSchema).innerJoin(part_model_1.partSchema, (0, drizzle_orm_1.eq)(part_model_1.partSchema.id, part_model_1.partShopFloorSchema.partId)).where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.id, shopFloorId)).limit(1);
        if (!shopFloor) {
            res.status(404).json(api_response_1.default.error('Shop floor not found'));
            return;
        }
        const part = shopFloor[0].parts;
        const shopFloorData = {
            ...shopFloor[0].parts_shop_floor,
            partNumber: part.partNumber,
            partName: part.partName,
        };
        res.json(api_response_1.default.success('Shop floor retrieved successfully', shopFloorData));
    }
    catch (error) {
        next(error);
    }
}
async function editPlanShopFloor(req, res, next) {
    try {
        const { id, planStart, planFinish } = req.body;
        if (!id || !planStart || !planFinish) {
            res.status(400).json(api_response_1.default.error('Order ID, Plan Start, and Plan Finish are required'));
            return;
        }
        const shopFloorId = parseInt(id, 10);
        if (isNaN(shopFloorId)) {
            res.status(400).json(api_response_1.default.error('Invalid Order ID'));
            return;
        }
        const startDate = new Date(planStart);
        const finishDate = new Date(planFinish);
        // Check if date inputs are valid
        if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
            res.status(400).json(api_response_1.default.error('Invalid date format for Plan Start or Plan Finish'));
            return;
        }
        // Ensure planStart is earlier than planFinish
        if (startDate >= finishDate) {
            res.status(400).json(api_response_1.default.error('Plan Start cannot be later than or equal to Plan Finish'));
            return;
        }
        const result = await db_1.db.update(part_model_1.partShopFloorSchema)
            .set({
            planStart: planStart,
            planFinish: planFinish,
        })
            .where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.id, shopFloorId));
        if (result[0].affectedRows === 0) {
            res.status(404).json(api_response_1.default.error('Order not found'));
            return;
        }
        res.json(api_response_1.default.success('Shop floor plan updated successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function updateStatusShopFloor(req, res, next) {
    try {
        const { id, status } = req.body;
        if (!id || !status) {
            res.status(400).json(api_response_1.default.error('Order ID and Status are required'));
            return;
        }
        if (!['pending', 'in_progress', 'finish'].includes(status)) {
            res.status(400).json(api_response_1.default.error('Invalid Status'));
            return;
        }
        const shopFloorId = parseInt(id, 10);
        if (isNaN(shopFloorId)) {
            res.status(400).json(api_response_1.default.error('Invalid Order ID'));
            return;
        }
        // Check if theres a plan start and finish
        const shopFloor = await db_1.db.select().from(part_model_1.partShopFloorSchema).where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.id, shopFloorId)).limit(1);
        if (!shopFloor) {
            res.status(404).json(api_response_1.default.error('Shop floor not found'));
            return;
        }
        if (!shopFloor[0].planStart || !shopFloor[0].planFinish) {
            res.status(400).json(api_response_1.default.error('Plan Start and Plan Finish are required'));
            return;
        }
        const currentTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');
        const updatedData = { status };
        if (status === 'in_progress') {
            updatedData.actualStart = currentTime;
        }
        else if (status === 'finish') {
            updatedData.actualFinish = currentTime;
        }
        // Update status
        await db_1.db.update(part_model_1.partShopFloorSchema)
            .set(updatedData)
            .where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.id, shopFloor[0].id));
        // If status is finish, change order status to deliver
        if (status === 'finish') {
            const result = await db_1.db.update(order_model_1.orderFabricationSchema)
                .set({ status: 'deliver' })
                .where((0, drizzle_orm_1.eq)(order_model_1.orderFabricationSchema.orderId, shopFloor[0].orderId));
            if (result[0].affectedRows === 0) {
                res.status(404).json(api_response_1.default.error('Order not found'));
                return;
            }
        }
        res.json(api_response_1.default.success('Shop floor status updated successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function getAllKanbans(req, res, next) {
    try {
        const selectedColumns = {};
        const kanbans = await db_1.db
            .select(selectedColumns)
            .from(kanban_model_1.kanbanSchema)
            .innerJoin(order_model_1.orderSchema, (0, drizzle_orm_1.eq)(order_model_1.orderSchema.id, kanban_model_1.kanbanSchema.orderId))
            .innerJoin(order_model_1.orderFabricationSchema, (0, drizzle_orm_1.eq)(order_model_1.orderFabricationSchema.orderId, order_model_1.orderSchema.id))
            .innerJoin(part_model_1.partSchema, (0, drizzle_orm_1.eq)(part_model_1.partSchema.id, order_model_1.orderFabricationSchema.partId));
        // Organize kanbans based on status
        const kanbansData = {
            queue: [],
            progress: [],
            done: [],
        };
        console.log(kanbans);
        res.json(api_response_1.default.success('Kanbans retrieved successfully', kanbansData));
    }
    catch (error) {
        next(error);
    }
}
exports.default = {
    getAllOrders,
    deliverOrder,
    getAllShopFloors,
    getShopFloorById,
    editPlanShopFloor,
    updateStatusShopFloor,
    getAllKanbans,
};
//# sourceMappingURL=asm-fabrication.handler.js.map