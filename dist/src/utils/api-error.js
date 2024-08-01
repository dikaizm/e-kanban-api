"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErr = exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.ApiError = ApiError;
function ApiErr(message, statusCode = 500) {
    return new ApiError(message, statusCode);
}
exports.ApiErr = ApiErr;
//# sourceMappingURL=api-error.js.map