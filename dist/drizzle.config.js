"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.MYSQL_DATABASE) {
    console.error('Please set the MYSQL_DATABASE environment variable');
    process.exit(1);
}
exports.default = {
    schema: './src/**/*.models.ts',
    out: './src/db/migrations',
    driver: 'mysql2',
    dbCredentials: {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE,
    },
};
//# sourceMappingURL=drizzle.config.js.map