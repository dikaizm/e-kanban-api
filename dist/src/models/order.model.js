"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverOrderFabricationSchema = exports.orderFabricationSchema = exports.orderStoreSchema = exports.orderSchema = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const part_model_1 = require("./part.model");
const station_model_1 = require("./station.model");
const user_models_1 = require("../api/user/user.models");
exports.orderSchema = (0, mysql_core_1.mysqlTable)('orders', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    stationId: (0, mysql_core_1.int)('station_id').notNull().references(() => station_model_1.stationSchema.id),
    createdBy: (0, mysql_core_1.int)('created_by').notNull().references(() => user_models_1.users.id),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.orderStoreSchema = (0, mysql_core_1.mysqlTable)('orders_store', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    orderId: (0, mysql_core_1.int)('order_id').notNull().references(() => exports.orderSchema.id),
    partId: (0, mysql_core_1.int)('part_id').notNull().references(() => part_model_1.partSchema.id),
    quantity: (0, mysql_core_1.int)('quantity').notNull(),
    status: (0, mysql_core_1.mysqlEnum)('status', ['pending', 'production', 'deliver', 'finish']).notNull().default('production'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.orderFabricationSchema = (0, mysql_core_1.mysqlTable)('orders_fabrication', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    orderId: (0, mysql_core_1.int)('order_id').notNull().references(() => exports.orderSchema.id),
    partId: (0, mysql_core_1.int)('part_id').notNull().references(() => part_model_1.partSchema.id),
    quantity: (0, mysql_core_1.int)('quantity').notNull(),
    status: (0, mysql_core_1.mysqlEnum)('status', ['pending', 'deliver', 'finish']).notNull().default('pending'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.deliverOrderFabricationSchema = (0, mysql_core_1.mysqlTable)('deliver_orders_fabrication', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    orderId: (0, mysql_core_1.int)('order_id').notNull().references(() => exports.orderSchema.id),
    partId: (0, mysql_core_1.int)('part_id').notNull().references(() => part_model_1.partSchema.id),
    status: (0, mysql_core_1.mysqlEnum)('status', ['deliver', 'finish']).notNull().default('deliver'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
//# sourceMappingURL=order.model.js.map