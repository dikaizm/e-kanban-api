"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_error_1 = require("../utils/api-error");
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    if (err instanceof api_error_1.ApiError) {
        res.status(err.statusCode);
    }
    res.json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
}
exports.default = errorHandler;
//# sourceMappingURL=error-handler.js.map