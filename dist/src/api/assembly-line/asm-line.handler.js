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
const global_const_1 = require("../../const/global.const");
const api_error_1 = require("../../utils/api-error");
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
        const { partNumber, quantity } = req.body;
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
            stationId: global_const_1.STATION_ID.ASSEMBLY_STORE,
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
        res.json(api_response_1.default.success('Order created successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function startAssembleProduct(req, res, next) {
    try {
        // Update each part quantity
        const parts = await db_1.db.select().from(part_model_1.partSchema);
        for (const part of parts) {
            await db_1.db.update(part_model_1.partSchema).set({ quantity: part.quantity - part.quantityReq }).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, part.id));
        }
        res.json(api_response_1.default.success('Start assemble product success', null));
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
    startAssembleProduct,
};
//# sourceMappingURL=asm-line.handler.js.map