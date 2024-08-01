"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartIdOrderId = exports.UpdateOrderPart = exports.NewOrderPart = exports.orderParts = exports.OrderStatus = exports.OrderId = exports.UpdateOrder = exports.NewOrder = exports.orders = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const zod_1 = __importDefault(require("zod"));
const user_models_1 = require("../user/user.models");
const drizzle_zod_1 = require("drizzle-zod");
const part_model_1 = require("../../models/part.model");
// Orders
exports.orders = (0, mysql_core_1.mysqlTable)('orders', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    description: (0, mysql_core_1.text)('description').notNull(),
    status: (0, mysql_core_1.varchar)('status', { length: 256 }).notNull(),
    qty: (0, mysql_core_1.int)('qty').notNull(),
    createdBy: (0, mysql_core_1.int)('created_by')
        .references(() => user_models_1.users.id, { onDelete: 'cascade' })
        .notNull(),
    startPlan: (0, mysql_core_1.datetime)('start_plan').notNull(),
    finishPlan: (0, mysql_core_1.datetime)('finish_plan').notNull(),
    startActual: (0, mysql_core_1.datetime)('start_actual'),
    finishActual: (0, mysql_core_1.datetime)('finish_actual'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.NewOrder = (0, drizzle_zod_1.createInsertSchema)(exports.orders, {
    description: zod_1.default.string().min(1),
    startPlan: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
    finishPlan: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
    qty: zod_1.default.number().int().positive(),
    status: zod_1.default.string().min(1).default('queue'),
    createdBy: zod_1.default.number().int().positive().default(1),
});
exports.UpdateOrder = zod_1.default.object({
    description: zod_1.default.string().min(1),
    startPlan: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
    finishPlan: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
    qty: zod_1.default.number().int().positive(),
});
exports.OrderId = zod_1.default.object({
    id: zod_1.default
        .string()
        .min(1)
        .refine((id) => !isNaN(parseInt(id)), { message: 'Invalid order id' }),
});
exports.OrderStatus = zod_1.default.object({
    status: zod_1.default.string().min(1),
});
// Order Parts
exports.orderParts = (0, mysql_core_1.mysqlTable)('order_parts', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    orderId: (0, mysql_core_1.int)('order_id')
        .references(() => exports.orders.id, { onDelete: 'cascade' })
        .notNull(),
    partId: (0, mysql_core_1.int)('part_id')
        .references(() => part_model_1.partSchema.id, { onDelete: 'cascade' })
        .notNull(),
    qty: (0, mysql_core_1.int)('qty').notNull(),
    status: (0, mysql_core_1.varchar)('status', { length: 256 }).notNull(),
    stationList: (0, mysql_core_1.varchar)('station_list', { length: 256 }).notNull(),
    startPlan: (0, mysql_core_1.datetime)('start_plan').notNull(),
    finishPlan: (0, mysql_core_1.datetime)('finish_plan').notNull(),
    startActual: (0, mysql_core_1.datetime)('start_actual'),
    finishActual: (0, mysql_core_1.datetime)('finish_actual'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.NewOrderPart = (0, drizzle_zod_1.createInsertSchema)(exports.orderParts, {
    orderId: zod_1.default.number().int().positive().default(1),
    partId: zod_1.default.number().int().positive(),
    qty: zod_1.default.number().int().positive(),
    status: zod_1.default.string().min(1),
    stationList: zod_1.default.string().min(1),
    startPlan: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
    finishPlan: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
});
exports.UpdateOrderPart = zod_1.default.object({
    stationList: zod_1.default.string().min(1),
    startPlan: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
    finishPlan: zod_1.default.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
    }),
    qty: zod_1.default.number().int().positive(),
});
exports.PartIdOrderId = zod_1.default.object({
    id: zod_1.default
        .string()
        .min(1)
        .refine((id) => !isNaN(parseInt(id)), { message: 'Invalid order id' }),
    partId: zod_1.default
        .string()
        .min(1)
        .refine((id) => !isNaN(parseInt(id)), { message: 'Invalid part id' }),
});
//# sourceMappingURL=order.models.js.map