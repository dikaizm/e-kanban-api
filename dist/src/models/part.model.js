"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.partShopFloorSchema = exports.partStoreSchema = exports.partSchema = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const order_model_1 = require("./order.model");
exports.partSchema = (0, mysql_core_1.mysqlTable)('parts', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    partNumber: (0, mysql_core_1.varchar)('part_number', { length: 15 }).unique().notNull(),
    partName: (0, mysql_core_1.varchar)('part_name', { length: 256 }).notNull(),
    quantity: (0, mysql_core_1.int)('quantity').notNull().default(0),
    quantityReq: (0, mysql_core_1.int)('quantity_req').notNull().default(0),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.partStoreSchema = (0, mysql_core_1.mysqlTable)('parts_store', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    partId: (0, mysql_core_1.int)('part_id').notNull().references(() => exports.partSchema.id),
    stock: (0, mysql_core_1.int)('stock').notNull().default(0),
    status: (0, mysql_core_1.mysqlEnum)('status', ['idle', 'order_to_fabrication', 'receive']).notNull().default('idle'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.partShopFloorSchema = (0, mysql_core_1.mysqlTable)('parts_shop_floor', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    partId: (0, mysql_core_1.int)('part_id').notNull().references(() => exports.partSchema.id),
    orderId: (0, mysql_core_1.int)('order_id').notNull().references(() => order_model_1.orderSchema.id),
    planStart: (0, mysql_core_1.datetime)('plan_start', { mode: 'string' }),
    planFinish: (0, mysql_core_1.datetime)('plan_finish', { mode: 'string' }),
    actualStart: (0, mysql_core_1.datetime)('actual_start', { mode: 'string' }),
    actualFinish: (0, mysql_core_1.datetime)('actual_finish', { mode: 'string' }),
    status: (0, mysql_core_1.mysqlEnum)('status', ['pending', 'in_progress', 'finish']).notNull().default('pending'),
    station: (0, mysql_core_1.mysqlEnum)('station', ['shop_floor']).notNull().default('shop_floor'),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
//# sourceMappingURL=part.model.js.map