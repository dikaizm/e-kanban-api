"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const api_1 = __importDefault(require("./api"));
const error_handler_1 = __importDefault(require("./middlewares/error-handler"));
const not_found_1 = __importDefault(require("./middlewares/not-found"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const allowlist = [
    'https://ekanban-manufacture.vercel.app',
    'http://localhost:5173',
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowlist.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600, // 10 minutes
};
app.use((0, morgan_1.default)('dev'));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Routes
app.use('/api/v1', api_1.default);
console.log('[server]: Router loaded');
// Error handling
app.use(not_found_1.default);
app.use(error_handler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map