"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function notFound(req, res, next) {
    res.status(404);
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
    next(error);
}
exports.default = notFound;
//# sourceMappingURL=not-found.js.map