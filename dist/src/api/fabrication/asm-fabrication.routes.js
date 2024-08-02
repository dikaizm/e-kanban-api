"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verify_token_1 = __importDefault(require("../../middlewares/verify-token"));
const asm_fabrication_handler_1 = __importDefault(require("./asm-fabrication.handler"));
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.send('Fabrication routes');
});
// GET /api/v1/fabrication/orders
router.get('/orders', verify_token_1.default, asm_fabrication_handler_1.default.getAllOrders);
// GET /api/v1/fabrication/orders/deliver/:orderId
router.get('/orders/deliver/:orderId', verify_token_1.default, asm_fabrication_handler_1.default.deliverOrder);
// GET /api/v1/fabrication/shop-floors
router.get('/shop-floors', verify_token_1.default, asm_fabrication_handler_1.default.getAllShopFloors);
// GET /api/v1/fabrication/shop-floors/:id
router.get('/shop-floors/:id', verify_token_1.default, asm_fabrication_handler_1.default.getShopFloorById);
// PUT /api/v1/fabrication/shop-floors/plan
router.put('/shop-floors/plan', verify_token_1.default, asm_fabrication_handler_1.default.editPlanShopFloor);
// PUT /api/v1/fabrication/shop-floors/status
router.put('/shop-floors/status', verify_token_1.default, asm_fabrication_handler_1.default.updateStatusShopFloor);
// GET /api/v1/fabrication/kanbans
router.get('/kanbans', verify_token_1.default, asm_fabrication_handler_1.default.getAllKanbans);
exports.default = router;
//# sourceMappingURL=asm-fabrication.routes.js.map