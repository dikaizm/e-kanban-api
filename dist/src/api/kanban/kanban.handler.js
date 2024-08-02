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