"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../api/user/user.service"));
const decode_token_1 = require("../utils/decode-token");
function verifyToken(req, res, next) {
    try {
        const headerAuth = req.headers.authorization;
        if (!headerAuth) {
            res.status(401);
            throw Error('Unauthorized');
        }
        const user = (0, decode_token_1.decodeToken)(headerAuth);
        const newToken = user_service_1.default.refreshToken(user);
        res.cookie('auth', newToken, { maxAge: 24 * 3600 * 1000, httpOnly: true });
        req.body.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
}
exports.default = verifyToken;
//# sourceMappingURL=verify-token.js.map