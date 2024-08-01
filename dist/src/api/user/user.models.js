"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginData = exports.RegisterData = exports.NewUser = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = __importDefault(require("zod"));
const userRoles = ['assembly_line_operator', 'assembly_store_operator', 'fabrication_operator', 'manager'];
exports.users = (0, mysql_core_1.mysqlTable)('users', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    name: (0, mysql_core_1.varchar)('name', { length: 256 }).notNull(),
    email: (0, mysql_core_1.varchar)('email', { length: 256 }).unique().notNull(),
    role: (0, mysql_core_1.mysqlEnum)('role', userRoles).notNull(),
    password: (0, mysql_core_1.varchar)('password', { length: 256 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)('updated_at').onUpdateNow(),
});
exports.NewUser = (0, drizzle_zod_1.createInsertSchema)(exports.users, {
    name: zod_1.default.string().min(1).max(256),
    email: zod_1.default.string().email().min(1).max(256),
    role: zod_1.default.enum(userRoles),
    password: zod_1.default.string().min(1).max(256),
});
exports.RegisterData = zod_1.default.object({
    name: zod_1.default.string().min(1).max(256),
    email: zod_1.default.string().email().min(1).max(256),
    role: zod_1.default.enum(userRoles),
    password: zod_1.default.string().min(1).max(256),
    confirmPassword: zod_1.default.string().min(1).max(256),
    registerKey: zod_1.default.string().min(1).max(256),
});
exports.LoginData = zod_1.default.object({
    email: zod_1.default.string().email().min(1).max(256),
    password: zod_1.default.string().min(1).max(256),
    remember: zod_1.default.boolean().optional(),
});
//# sourceMappingURL=user.models.js.map