"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stationSchema = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.stationSchema = (0, mysql_core_1.mysqlTable)('stations', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    name: (0, mysql_core_1.varchar)('name', { length: 256 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
//# sourceMappingURL=station.model.js.map