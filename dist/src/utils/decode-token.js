"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = __importDefault(require("../config/auth"));
const api_error_1 = require("./api-error");
function decodeToken(authHeader) {
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw (0, api_error_1.ApiErr)('Unauthorized', 401);
    }
    let user;
    (0, jsonwebtoken_1.verify)(token, auth_1.default.secret, function (err, decoded) {
        if (err) {
            throw (0, api_error_1.ApiErr)(err.message, 401);
        }
        user = decoded;
    });
    return user;
}
exports.decodeToken = decodeToken;
//# sourceMappingURL=decode-token.js.map