"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const mysql2_1 = require("drizzle-orm/mysql2");
const mysql2_2 = __importDefault(require("mysql2"));
const database_1 = require("../config/database");
const connection = mysql2_2.default.createConnection({
    host: database_1.mysqlConfig.host,
    user: database_1.mysqlConfig.user,
    password: database_1.mysqlConfig.password,
    database: database_1.mysqlConfig.database,
});
exports.db = (0, mysql2_1.drizzle)(connection);
//# sourceMappingURL=index.js.map