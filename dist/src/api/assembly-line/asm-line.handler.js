"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_response_1 = __importDefault(require("../../utils/api-response"));
const db_1 = require("../../db");
const part_model_1 = require("../../models/part.model");
const drizzle_orm_1 = require("drizzle-orm");
const order_model_1 = require("../../models/order.model");
const const_1 = require("../../const");
const api_error_1 = require("../../utils/api-error");
const kanban_model_1 = require("../../models/kanban.model");
const qr_code_1 = require("../../utils/qr-code");
const station_model_1 = require("../../models/station.model");
const PART_STATUS = {
    COMPLETE: 'Complete',
    INCOMPLETE: 'Incomplete',
};
async function getAllParts(req, res, next) {
    try {
        const parts = await db_1.db.select().from(part_model_1.partSchema);
        // Check part status
        let partStatus = PART_STATUS.COMPLETE;
        parts.forEach((part) => {
            if (part.quantityReq > part.quantity) {
                partStatus = PART_STATUS.INCOMPLETE;
            }
        });
        res.json(api_response_1.default.success('Parts retrieved successfully', { parts, partStatus }));
    }
    catch (error) {
        next(error);
    }
}
async function getPartById(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) {
            throw (0, api_error_1.ApiErr)('Invalid request', 400);
        }
        const part = await db_1.db.select().from(part_model_1.partSchema).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, parseInt(id)));
        if (part.length === 0) {
            throw (0, api_error_1.ApiErr)('Part not found', 404);
        }
        res.json(api_response_1.default.success('Part retrieved successfully', part[0]));
    }
    catch (error) {
        next(error);
    }
}
async function updatePartQuantity(req, res, next) {
    try {
        const { id, quantity } = req.body;
        if (!id || !quantity) {
            throw (0, api_error_1.ApiErr)('Invalid request', 400);
        }
        if (parseInt(quantity) <= 0) {
            throw (0, api_error_1.ApiErr)('Quantity must be greater than 0', 400);
        }
        const partId = parseInt(id);
        const result = await db_1.db.update(part_model_1.partSchema).set({ quantity }).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, partId));
        if (result[0].affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Part not found', 404);
        }
        res.json(api_response_1.default.success('Part quantity updated successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function createOrder(req, res, next) {
    try {
        const { partNumber, quantity, requestHost } = req.body;
        if (!partNumber || !quantity) {
            res.status(400).json(api_response_1.default.error('Invalid request'));
        }
        if (parseInt(quantity) <= 0) {
            res.status(400).json(api_response_1.default.error('Quantity must be greater than 0'));
        }
        const parts = await db_1.db.select().from(part_model_1.partSchema).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.partNumber, partNumber));
        if (parts.length === 0) {
            res.status(404).json(api_response_1.default.error('Part not found'));
        }
        const part = parts[0];
        // Insert to order
        const order = await db_1.db.insert(order_model_1.orderSchema).values({
            stationId: const_1.STATION_ID.ASSEMBLY_STORE,
            createdBy: req.body.user.id,
        });
        // Check part stock in store
        let partStore = await db_1.db.select().from(part_model_1.partStoreSchema).where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.partId, part.id)).limit(1);
        if (partStore.length === 0) {
            // Insert to part store
            await db_1.db.insert(part_model_1.partStoreSchema).values({
                partId: part.id,
                stock: 0,
                status: 'idle',
            });
            partStore = await db_1.db.select().from(part_model_1.partStoreSchema).where((0, drizzle_orm_1.eq)(part_model_1.partStoreSchema.partId, part.id)).limit(1);
        }
        // Insert to order store
        await db_1.db.insert(order_model_1.orderStoreSchema).values({
            orderId: order[0].insertId,
            partId: part.id,
            quantity: quantity,
            status: 'pending',
        });
        // Insert to kanban
        const currentTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');
        const kanbanId = `${Math.random().toString(36).substr(2, 8)}-${Math.floor(Math.random() * 1E7)}`;
        const qrCodeContent = `${requestHost}/confirm-kanban/${kanbanId}`;
        const qrCode = await (0, qr_code_1.generateQR)(qrCodeContent);
        const newKanban = await db_1.db.insert(kanban_model_1.kanbanSchema).values({
            id: kanbanId,
            cardId: 'RYIN001',
            type: 'production',
            status: 'queue',
            qrCode: qrCode,
            orderId: order[0].insertId,
            orderDate: currentTime,
            planStart: currentTime,
            stationId: const_1.STATION_ID.ASSEMBLY_LINE,
        });
        if (newKanban[0].affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to create kanban', 500);
        }
        res.json(api_response_1.default.success('Order created successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function deleteOrderById(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) {
            throw (0, api_error_1.ApiErr)('Invalid request', 400);
        }
        const orderId = parseInt(id);
        // Check order status
        const order = await db_1.db.select().from(order_model_1.orderSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderSchema.id, orderId));
        if (order.length === 0) {
            throw (0, api_error_1.ApiErr)('Order not found', 404);
        }
        // Check if part shop floor status already in progress
        const partShopFloor = await db_1.db.select().from(part_model_1.partShopFloorSchema).where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.orderId, orderId));
        if (partShopFloor.length > 0) {
            if (partShopFloor[0].status === 'in_progress') {
                throw (0, api_error_1.ApiErr)('Cannot delete order, part fabrication already in progress', 400);
            }
            else if (partShopFloor[0].status === 'finish') {
                throw (0, api_error_1.ApiErr)('Cannot delete order, part fabrication already finished', 400);
            }
        }
        // Delete order line
        await db_1.db.delete(order_model_1.orderLineSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderLineSchema.orderId, orderId));
        // Delete order store
        await db_1.db.delete(order_model_1.orderStoreSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderStoreSchema.orderId, orderId));
        // Delete order fabrication
        await db_1.db.delete(order_model_1.orderFabricationSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderFabricationSchema.orderId, orderId));
        // Delete part shop floor
        await db_1.db.delete(part_model_1.partShopFloorSchema).where((0, drizzle_orm_1.eq)(part_model_1.partShopFloorSchema.orderId, orderId));
        // Delete kanban
        await db_1.db.delete(kanban_model_1.kanbanSchema).where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.orderId, orderId));
        // Delete order
        await db_1.db.delete(order_model_1.orderSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderSchema.id, orderId));
        res.json(api_response_1.default.success('Order deleted successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function startAssembleComponent(req, res, next) {
    try {
        const { requestHost, componentId } = req.body;
        if (!requestHost || !componentId) {
            throw (0, api_error_1.ApiErr)('Invalid request', 400);
        }
        // Update each part quantity
        const parts = await db_1.db.select().from(part_model_1.partSchema);
        let isPartComponentExist = false;
        const partComponent = await db_1.db.select().from(part_model_1.partComponentSchema).where((0, drizzle_orm_1.eq)(part_model_1.partComponentSchema.componentId, componentId));
        if (partComponent.length > 0) {
            isPartComponentExist = true;
        }
        for (const part of parts) {
            // Count part availability
            const newQuantity = part.quantity - part.quantityReq;
            if (newQuantity < 0) {
                throw (0, api_error_1.ApiErr)('Part quantity does not meet requirement', 400);
            }
            await db_1.db.update(part_model_1.partSchema).set({ quantity: newQuantity }).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, part.id));
            // Insert to part component if not exist
            if (!isPartComponentExist) {
                await db_1.db.insert(part_model_1.partComponentSchema).values({
                    componentId: componentId,
                    partId: part.id,
                });
            }
        }
        // Create new order
        const newOrder = await db_1.db.insert(order_model_1.orderSchema).values({
            stationId: const_1.STATION_ID.ASSEMBLY_LINE,
            createdBy: req.body.user.id,
        });
        // Insert to order line
        await db_1.db.insert(order_model_1.orderLineSchema).values({
            orderId: newOrder[0].insertId,
            componentId: componentId,
            status: 'progress',
            quantity: 1,
        });
        // Insert to kanban
        const currentTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');
        const kanbanId = `${Math.random().toString(36).substr(2, 8)}-${Math.floor(Math.random() * 1E7)}`;
        const qrCodeContent = `${requestHost}/confirm-kanban/${kanbanId}`;
        const qrCode = await (0, qr_code_1.generateQR)(qrCodeContent);
        const newKanban = await db_1.db.insert(kanban_model_1.kanbanSchema).values({
            id: kanbanId,
            cardId: 'RYIN002',
            type: 'withdrawal',
            status: 'progress',
            qrCode: qrCode,
            orderId: newOrder[0].insertId,
            orderDate: currentTime,
            planStart: currentTime,
            stationId: const_1.STATION_ID.ASSEMBLY_LINE,
        });
        if (newKanban[0].affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to create kanban', 500);
        }
        // Insert to kanban withdrawal
        await db_1.db.insert(kanban_model_1.kanbanWithdrawalSchema).values({
            kanbanId: kanbanId,
            prevStationId: const_1.STATION_ID.ASSEMBLY_STORE,
            nextStationId: const_1.STATION_ID.ASSEMBLY_LINE,
        });
        res.json(api_response_1.default.success('Start assemble product success', null));
    }
    catch (error) {
        next(error);
    }
}
async function getAllKanbans(req, res, next) {
    try {
        const selectedWithdrawalColumns = {
            id: kanban_model_1.kanbanSchema.id,
            partName: part_model_1.componentSchema.name,
            quantity: order_model_1.orderLineSchema.quantity,
            planStart: kanban_model_1.kanbanSchema.planStart,
            status: kanban_model_1.kanbanSchema.status,
            cardId: kanban_model_1.kanbanSchema.cardId,
            type: kanban_model_1.kanbanSchema.type,
            orderId: kanban_model_1.kanbanSchema.orderId,
            stationName: station_model_1.stationSchema.name,
        };
        const kanbanWithdrawals = await db_1.db.select(selectedWithdrawalColumns).from(kanban_model_1.kanbanSchema)
            .innerJoin(kanban_model_1.kanbanWithdrawalSchema, (0, drizzle_orm_1.eq)(kanban_model_1.kanbanWithdrawalSchema.kanbanId, kanban_model_1.kanbanSchema.id))
            .innerJoin(order_model_1.orderSchema, (0, drizzle_orm_1.eq)(order_model_1.orderSchema.id, kanban_model_1.kanbanSchema.orderId))
            .innerJoin(order_model_1.orderLineSchema, (0, drizzle_orm_1.eq)(order_model_1.orderLineSchema.orderId, order_model_1.orderSchema.id))
            .innerJoin(part_model_1.componentSchema, (0, drizzle_orm_1.eq)(part_model_1.componentSchema.id, order_model_1.orderLineSchema.componentId))
            .innerJoin(station_model_1.stationSchema, (0, drizzle_orm_1.eq)(station_model_1.stationSchema.id, kanban_model_1.kanbanSchema.stationId))
            .where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.stationId, const_1.STATION_ID.ASSEMBLY_LINE))
            .orderBy((0, drizzle_orm_1.desc)(kanban_model_1.kanbanSchema.createdAt));
        const selectedProductionColumns = {
            id: kanban_model_1.kanbanSchema.id,
            partNumber: part_model_1.partSchema.partNumber,
            partName: part_model_1.partSchema.partName,
            quantity: order_model_1.orderStoreSchema.quantity,
            planStart: kanban_model_1.kanbanSchema.planStart,
            status: kanban_model_1.kanbanSchema.status,
            cardId: kanban_model_1.kanbanSchema.cardId,
            type: kanban_model_1.kanbanSchema.type,
            orderId: kanban_model_1.kanbanSchema.orderId,
            stationName: station_model_1.stationSchema.name,
        };
        const kanbanProductions = await db_1.db.select(selectedProductionColumns).from(kanban_model_1.kanbanSchema)
            .innerJoin(order_model_1.orderSchema, (0, drizzle_orm_1.eq)(order_model_1.orderSchema.id, kanban_model_1.kanbanSchema.orderId))
            .innerJoin(order_model_1.orderStoreSchema, (0, drizzle_orm_1.eq)(order_model_1.orderStoreSchema.orderId, order_model_1.orderSchema.id))
            .innerJoin(part_model_1.partSchema, (0, drizzle_orm_1.eq)(part_model_1.partSchema.id, order_model_1.orderStoreSchema.partId))
            .innerJoin(station_model_1.stationSchema, (0, drizzle_orm_1.eq)(station_model_1.stationSchema.id, kanban_model_1.kanbanSchema.stationId))
            .where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.stationId, const_1.STATION_ID.ASSEMBLY_LINE))
            .orderBy((0, drizzle_orm_1.desc)(kanban_model_1.kanbanSchema.createdAt));
        // Organize kanbans
        const kanbansData = {
            queue: [],
            progress: [],
            done: [],
        };
        kanbanProductions.forEach((kanban) => {
            if (kanban.status === 'queue') {
                kanbansData.queue.push(kanban);
            }
        });
        kanbanWithdrawals.forEach((kanban) => {
            if (kanban.status === 'progress') {
                kanbansData.progress.push(kanban);
            }
            else if (kanban.status === 'done') {
                kanbansData.done.push(kanban);
            }
        });
        res.json(api_response_1.default.success('Kanbans retrieved successfully', kanbansData));
    }
    catch (error) {
        next(error);
    }
}
exports.default = {
    getAllParts,
    getPartById,
    updatePartQuantity,
    createOrder,
    deleteOrderById,
    startAssembleComponent,
    getAllKanbans,
};
//# sourceMappingURL=asm-line.handler.js.map