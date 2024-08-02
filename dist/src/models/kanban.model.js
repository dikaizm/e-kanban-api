"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kanbanWithdrawalSchema = exports.kanbanSchema = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const order_model_1 = require("./order.model");
const station_model_1 = require("./station.model");
exports.kanbanSchema = (0, mysql_core_1.mysqlTable)('kanbans', {
    id: (0, mysql_core_1.varchar)('id', { length: 16 }).primaryKey(),
    type: (0, mysql_core_1.mysqlEnum)('type', ['production', 'withdrawal']).notNull(),
    cardId: (0, mysql_core_1.mysqlEnum)('card_id', ['RYIN001', 'RYIN002']).notNull(),
    status: (0, mysql_core_1.mysqlEnum)('status', ['queue', 'progress', 'done']).notNull().default('queue'),
    qrCode: (0, mysql_core_1.text)('qr_code').notNull(),
    orderId: (0, mysql_core_1.int)('order_id').notNull().references(() => order_model_1.orderSchema.id),
    orderDate: (0, mysql_core_1.datetime)('order_date', { mode: 'string' }).notNull(),
    finishDate: (0, mysql_core_1.datetime)('finish_date', { mode: 'string' }),
    planStart: (0, mysql_core_1.datetime)('plan_start', { mode: 'string' }),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.kanbanWithdrawalSchema = (0, mysql_core_1.mysqlTable)('kanbans_withdrawal', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    kanbanId: (0, mysql_core_1.varchar)('kanban_id', { length: 16 }).notNull().references(() => exports.kanbanSchema.id),
    prevStation: (0, mysql_core_1.int)('prev_station').notNull().references(() => station_model_1.stationSchema.id),
    nextStation: (0, mysql_core_1.int)('next_station').notNull().references(() => station_model_1.stationSchema.id),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
//# sourceMappingURL=kanban.model.js.map