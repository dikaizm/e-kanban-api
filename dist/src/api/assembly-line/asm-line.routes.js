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
// GET /api/v1/assembly-line/part
router.get('/part/:id', verify_token_1.default, asm_line_handler_1.default.getPartById);
// PUT /api/v1/assembly-line/part
router.put('/part', verify_token_1.default, asm_line_handler_1.default.updatePartQuantity);
// POST /api/v1/assembly-line/order
router.post('/order', verify_token_1.default, asm_line_handler_1.default.createOrder);
// DELETE /api/v1/assembly-line/order/:id
router.delete('/order/:id', verify_token_1.default, asm_line_handler_1.default.deleteOrderById);
// POST /api/v1/assembly-line/start
router.post('/parts/start', verify_token_1.default, asm_line_handler_1.default.startAssembleComponent);
// GET /api/v1/assembly-line/kanbans
router.get('/kanbans', verify_token_1.default, asm_line_handler_1.default.getAllKanbans);
exports.default = router;
//# sourceMappingURL=asm-line.routes.js.map