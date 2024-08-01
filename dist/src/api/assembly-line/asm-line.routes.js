"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verify_token_1 = __importDefault(require("../../middlewares/verify-token"));
const asm_line_handler_1 = __importDefault(require("./asm-line.handler"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.send('Assembly Line routes');
});
// GET /api/v1/assembly-line/parts
router.get('/parts', verify_token_1.default, asm_line_handler_1.default.getAllParts);
// POST /api/v1/assembly-line/order
router.post('/order', verify_token_1.default, asm_line_handler_1.default.createOrder);
exports.default = router;
//# sourceMappingURL=asm-line.routes.js.map