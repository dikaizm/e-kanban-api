"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function success(message, data) {
    return { success: true, message, data };
}
function error(message, stack) {
    return { success: false, message, stack };
}
exports.default = {
    success,
    error,
};
//# sourceMappingURL=api-response.js.map