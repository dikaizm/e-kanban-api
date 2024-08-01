"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_request_1 = __importDefault(require("../../middlewares/validate-request"));
const verify_token_1 = __importDefault(require("../../middlewares/verify-token"));
const user_handler_1 = __importDefault(require("./user.handler"));
const user_models_1 = require("./user.models");
const router = express_1.default.Router();
router.post('/login', (0, validate_request_1.default)({ body: user_models_1.LoginData }), user_handler_1.default.login);
router.post('/register', (0, validate_request_1.default)({ body: user_models_1.RegisterData }), user_handler_1.default.register);
router.get('/me', verify_token_1.default, user_handler_1.default.me);
exports.default = router;
//# sourceMappingURL=user.routes.js.map