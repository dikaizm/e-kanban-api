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
async function getKanbanById(req, res, next) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json(api_response_1.default.error('Kanban ID is required'));
            return;
        }
        const kanban = await db_1.db.select().from(kanban_model_1.kanbanSchema).where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.id, id)).limit(1);
        if (kanban.length === 0) {
            res.status(404).json(api_response_1.default.error('Kanban not found'));
            return;
        }
        const kanbanData = kanban[0];
        if (kanbanData.type === 'withdrawal') {
            const kanbanWithdrawal = await db_1.db
                .select()
                .from(kanban_model_1.kanbanWithdrawalSchema)
                .where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanWithdrawalSchema.kanbanId, id))
                .limit(1);
            if (kanbanWithdrawal.length === 0) {
                res.status(404).json(api_response_1.default.error('Kanban withdrawal not found'));
                return;
            }
            kanbanData.withdrawal = kanbanWithdrawal[0];
        }
        else {
            // Get parts data
            const orderStore = await db_1.db.select().from(order_model_1.orderFabricationSchema).where((0, drizzle_orm_1.eq)(order_model_1.orderFabricationSchema.orderId, kanbanData.orderId)).limit(1);
            if (orderStore.length === 0) {
                res.status(404).json(api_response_1.default.error('Order not found'));
                return;
            }
            const part = await db_1.db.select().from(part_model_1.partSchema).where((0, drizzle_orm_1.eq)(part_model_1.partSchema.id, orderStore[0].partId)).limit(1);
            if (part.length === 0) {
                res.status(404).json(api_response_1.default.error('Part not found'));
                return;
            }
            kanbanData.quantity = orderStore[0].quantity;
            kanbanData.partName = part[0].partName;
            kanbanData.partNumber = part[0].partNumber;
        }
        res.json(api_response_1.default.success('Kanban retrieved successfully', kanbanData));
    }
    catch (error) {
        next(error);
    }
}
async function updateKanbanStatus(req, res, next) {
    try {
        const { id, status } = req.body;
        if (!id || !status) {
            throw (0, api_error_1.ApiErr)('Kanban ID and status are required', 400);
        }
        const kanban = await db_1.db.select().from(kanban_model_1.kanbanSchema).where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.id, id)).limit(1);
        if (kanban.length === 0) {
            throw (0, api_error_1.ApiErr)('Kanban not found', 404);
        }
        const kanbanData = kanban[0];
        if (kanbanData.status === status) {
            throw (0, api_error_1.ApiErr)('Kanban status is already the same', 400);
        }
        else if (kanbanData.status === 'queue') {
            if (status !== 'progress') {
                throw (0, api_error_1.ApiErr)('Kanban status can only be changed to progress', 400);
            }
            await db_1.db.update(kanban_model_1.kanbanSchema).set({ status }).where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.id, id));
        }
        else if (kanbanData.status === 'progress') {
            if (status !== 'done') {
                throw (0, api_error_1.ApiErr)('Kanban status can only be changed to done', 400);
            }
            await db_1.db.update(kanban_model_1.kanbanSchema).set({ status }).where((0, drizzle_orm_1.eq)(kanban_model_1.kanbanSchema.id, id));
        }
        else {
            throw (0, api_error_1.ApiErr)('Kanban status cannot be changed', 400);
        }
        res.json(api_response_1.default.success('Kanban status updated successfully', null));
    }
    catch (error) {
        next(error);
    }
}
exports.default = {
    getKanbanById,
    updateKanbanStatus,
};
//# sourceMappingURL=kanban.handler.js.map