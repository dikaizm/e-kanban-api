"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asm_store_handler_1 = __importDefault(require("./asm-store.handler"));
const verify_token_1 = __importDefault(require("../../middlewares/verify-token"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.send('Assembly Line routes');
});
// GET /api/v1/assembly-store/orders
router.get('/orders', verify_token_1.default, asm_store_handler_1.default.getAllOrders);
// POST /api/v1/assembly-store/orders/status
router.post('/orders/status', verify_token_1.default, asm_store_handler_1.default.updateOrderStatus);
// GET /api/v1/assembly-store/parts
router.get('/parts', verify_token_1.default, asm_store_handler_1.default.getAllParts);
// PUT /api/v1/assembly-store/parts/status
router.put('/parts/status', verify_token_1.default, asm_store_handler_1.default.updatePartStatus);
exports.default = router;
//# sourceMappingURL=asm-store.routes.js.map