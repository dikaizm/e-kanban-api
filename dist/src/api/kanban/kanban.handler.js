"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_response_1 = __importDefault(require("../../utils/api-response"));
const db_1 = require("../../db");
const kanban_model_1 = require("../../models/kanban.model");
const drizzle_orm_1 = require("drizzle-orm");
const order_model_1 = require("../../models/order.model");
const part_model_1 = require("../../models/part.model");
const api_error_1 = require("../../utils/api-error");
const const_1 = require("../../const");
const station_model_1 = require("../../models/station.model");
const qr_code_1 = require("../../utils/qr-code");
async function getKanbanById(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) {
            throw (0, api_error_1.ApiErr)('Kanban ID is required', 400);
        }
        const kanban = await db_1.db.select({
            id: kanban_model_1.kanbanSchema.id,
            type: kanban_model_1.kanbanSchema.type,
            cardId: kanban_model_1.kanbanSchema.cardId,
            status: kanban_model_1.kanbanSchema.status,
            qrCode: kanban_model_1.kanbanSchema.qrCode,
            orderId: kanban_model_1.kanbanSchema.orderId,
            orderDate: kanban_model_1.kanbanSchema.orderDate,
            finishDate: kanban_model_1.kanbanSchema.finishDate,
            planStart: kanban_model_1.kanbanSchema.planStart,
            stationId: kanban_model_1.kanbanSchema.stationId,
            stationName: station_model_1.stationSchema.name,
        }).from(kanban_model_1.kanbanSchema)
            .innerJoin(station_model_1.stationSchema, (0, drizzle_orm_1.eq)(station_model_1.stationSchema.id, kanban_model_1.kanbanSchema.stationId))
            .where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.id, id))
            .limit(1);
        if (kanban.length === 0) {
            throw (0, api_error_1.ApiErr)('Kanban not found', 404);
        }
        const kanbanData = kanban[0];
        if (kanbanData.type === 'withdrawal') {
            const kanbanWithdrawal = await db_1.db.select().from(kanban_model_1.kanbanWithdrawalSchema)
                .where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanWithdrawalSchema.kanbanId, kanbanData.id)).limit(1);
            if (kanbanWithdrawal.length === 0) {
                throw (0, api_error_1.ApiErr)('Kanban withdrawal not found', 404);
            }
            kanbanData.prevStation = (0, qr_code_1.getStationName)(kanbanWithdrawal[0].prevStationId);
            kanbanData.nextStation = (0, qr_code_1.getStationName)(kanbanWithdrawal[0].nextStationId);
            const orderLine = await db_1.db.select({
                quantity: order_model_1.orderLineSchema.quantity,
                componentName: part_model_1.componentSchema.name,
                componentId: order_model_1.orderLineSchema.componentId,
            }).from(order_model_1.orderLineSchema)
                .innerJoin(part_model_1.componentSchema, (0, drizzle_orm_1.eq)(part_model_1.componentSchema.id, order_model_1.orderLineSchema.componentId))
                .where((0, drizzle_orm_1.eq)(order_model_1.orderLineSchema.orderId, kanbanData.orderId)).limit(1);
            if (orderLine.length === 0) {
                throw (0, api_error_1.ApiErr)('Order line not found', 404);
            }
            kanbanData.partName = orderLine[0].componentName;
            kanbanData.quantity = orderLine[0].quantity;
            // Get part numbers based on component id
            const partComponents = await db_1.db.select().from(part_model_1.partComponentSchema).where((0, drizzle_orm_1.eq)(part_model_1.partComponentSchema.componentId, orderLine[0].componentId));
            if (partComponents.length === 0) {
                throw (0, api_error_1.ApiErr)('Part component not found', 404);
            }
            const partIds = partComponents.map((partComponent) => partComponent.partId);
            const parts = await db_1.db.select().from(part_model_1.partSchema).where((0, drizzle_orm_1.inArray)(part_model_1.partSchema.id, partIds));
            if (parts.length === 0) {
                throw (0, api_error_1.ApiErr)('Part not found', 404);
            }
            kanbanData.partNumber = parts.map((part) => part.partNumber);
        }
        else {
            const orderStore = await db_1.db.select().from(order_model_1.orderStoreSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderStoreSchema.orderId, kanbanData.orderId)).limit(1);
            if (orderStore.length === 0) {
                throw (0, api_error_1.ApiErr)('Order not found', 404);
            }
            if (kanbanData.stationId !== const_1.STATION_ID.ASSEMBLY_LINE) {
                // Get parts data
                const shopFloor = await db_1.db.select().from(part_model_1.partShopFloorSchema).where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.orderId, kanbanData.orderId)).limit(1);
                if (shopFloor.length === 0) {
                    throw (0, api_error_1.ApiErr)('Part shop floor not found', 404);
                }
                kanbanData.planStart = shopFloor[0].planStart;
                kanbanData.finishDate = shopFloor[0].actualFinish;
            }
            const part = await db_1.db.select().from(part_model_1.partSchema).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, orderStore[0].partId)).limit(1);
            if (part.length === 0) {
                throw (0, api_error_1.ApiErr)('Part not found', 404);
            }
            kanbanData.quantity = orderStore[0].quantity;
            kanbanData.partName = part[0].partName;
            kanbanData.partNumber = [part[0].partNumber];
        }
        res.json(api_response_1.default.success('Kanban retrieved successfully', kanbanData));
    }
    catch (error) {
        next(error);
    }
}
async function handleQueueStatus(status, orderData, shopFloorData, currentTime) {
    if (status !== 'progress') {
        throw (0, api_error_1.ApiErr)('Kanban status can only be changed to progress', 400);
    }
    if (orderData.stationId === const_1.STATION_ID.ASSEMBLY_LINE) {
        // TODO: Implement logic for assembly line kanban
    }
    else {
        if (!shopFloorData.planFinish || !shopFloorData.planStart) {
            throw (0, api_error_1.ApiErr)('Plan start and plan finish are required, set it in Shop Floor', 400);
        }
        await db_1.db.update(part_model_1.partShopFloorSchema)
            .set({ status: 'in_progress', actualStart: currentTime })
            .where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.orderId, orderData.id));
    }
}
async function handleProgressStatus(status, orderData, shopFloorData, currentTime) {
    if (status !== 'done') {
        throw (0, api_error_1.ApiErr)('Kanban status can only be changed to done', 400);
    }
    if (orderData.stationId === const_1.STATION_ID.ASSEMBLY_LINE) {
        // TODO: Implement logic for assembly line kanban
        await db_1.db.update(kanban_model_1.kanbanSchema).set({ finishDate: currentTime }).where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.orderId, orderData.id));
    }
    else {
        if (shopFloorData.status !== 'in_progress') {
            throw (0, api_error_1.ApiErr)('Part shop floor status must be in progress', 400);
        }
        await db_1.db.update(part_model_1.partShopFloorSchema)
            .set({ status: 'finish', actualFinish: currentTime })
            .where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.orderId, orderData.id));
        const result = await db_1.db.update(order_model_1.orderFabricationSchema)
            .set({ status: 'deliver' })
            .where((0, drizzle_orm_1.eq)(order_model_1.orderFabricationSchema.orderId, shopFloorData.orderId));
        if (!result[0].affectedRows) {
            throw (0, api_error_1.ApiErr)('Order not found', 404);
        }
    }
}
async function updateKanbanStatus(req, res, next) {
    try {
        const { id, status } = req.body;
        if (!id || !status) {
            throw (0, api_error_1.ApiErr)('Kanban ID and status are required', 400);
        }
        const kanban = await db_1.db.select().from(kanban_model_1.kanbanSchema).where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.id, id)).limit(1);
        if (!kanban.length) {
            throw (0, api_error_1.ApiErr)('Kanban not found', 404);
        }
        const kanbanData = kanban[0];
        const order = await db_1.db.select().from(order_model_1.orderSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderSchema.id, kanbanData.orderId)).limit(1);
        if (!order.length) {
            throw (0, api_error_1.ApiErr)('Order not found', 404);
        }
        const orderData = order[0];
        let shopFloorData;
        if (orderData.stationId === const_1.STATION_ID.FABRICATION) {
            const partShopFloor = await db_1.db.select().from(part_model_1.partShopFloorSchema).where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.orderId, orderData.id)).limit(1);
            if (!partShopFloor.length) {
                throw (0, api_error_1.ApiErr)('Part shop floor not found', 404);
            }
            shopFloorData = partShopFloor[0];
            const isStatusSynced = ((kanbanData.status === 'queue' && shopFloorData.status === 'pending') ||
                (kanbanData.status === 'progress' && shopFloorData.status === 'in_progress') ||
                (kanbanData.status === 'done' && shopFloorData.status === 'finish'));
            if (!isStatusSynced) {
                throw (0, api_error_1.ApiErr)('Kanban status is not synced with Shop Floor status', 400);
            }
        }
        const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (kanbanData.status === status) {
            throw (0, api_error_1.ApiErr)('Kanban status is already the same', 400);
        }
        switch (kanbanData.status) {
            case 'queue':
                await handleQueueStatus(status, orderData, shopFloorData, currentTime);
                break;
            case 'progress':
                await handleProgressStatus(status, orderData, shopFloorData, currentTime);
                break;
            default:
                throw (0, api_error_1.ApiErr)('Kanban status cannot be changed', 400);
        }
        await db_1.db.update(kanban_model_1.kanbanSchema).set({ status }).where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.id, id));
        res.json(api_response_1.default.success('Kanban status updated successfully', null));
    }
    catch (error) {
        console.error(error);
        next(error);
    }
}
exports.default = {
    getKanbanById,
    updateKanbanStatus,
};
//# sourceMappingURL=kanban.handler.js.map