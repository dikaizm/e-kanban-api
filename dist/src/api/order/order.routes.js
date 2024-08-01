"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_request_1 = __importDefault(require("../../middlewares/validate-request"));
const verify_token_1 = __importDefault(require("../../middlewares/verify-token"));
const order_handler_1 = __importDefault(require("./order.handler"));
const order_models_1 = require("./order.models");
const router = express_1.default.Router();
// GET /api/v1/orders
router.get('/', [verify_token_1.default], order_handler_1.default.getAllOrders);
// POST /api/v1/orders
router.post('/', [verify_token_1.default, (0, validate_request_1.default)({ body: order_models_1.NewOrder })], order_handler_1.default.createOrder);
// GET /api/v1/orders/:id
router.get('/:id', [verify_token_1.default, (0, validate_request_1.default)({ params: order_models_1.OrderId })], order_handler_1.default.getOrderById);
// PATCH /api/v1/orders/:id
router.patch('/:id', [verify_token_1.default, (0, validate_request_1.default)({ params: order_models_1.OrderId, body: order_models_1.UpdateOrder })], order_handler_1.default.updateOrder);
// DELETE /api/v1/orders/:id
router.delete('/:id', [verify_token_1.default, (0, validate_request_1.default)({ params: order_models_1.OrderId })], order_handler_1.default.deleteOrder);
// POST /api/v1/order/:id/status
router.post('/:id/status', [verify_token_1.default, (0, validate_request_1.default)({ params: order_models_1.OrderId, body: order_models_1.OrderStatus })], order_handler_1.default.changeOrderStatus);
// POST /api/v1/orders/:id/parts
router.post('/:id/parts', [verify_token_1.default, (0, validate_request_1.default)({ params: order_models_1.OrderId, body: order_models_1.NewOrderPart })], order_handler_1.default.addPartToOrder);
// PATCH /api/v1/orders/:orderId/parts/:partId
router.patch('/:id/parts/:partId', [verify_token_1.default, (0, validate_request_1.default)({ params: order_models_1.PartIdOrderId, body: order_models_1.UpdateOrderPart })], order_handler_1.default.updateOrderPart);
// DELETE /api/v1/orders/:orderId/parts/:partId
router.delete('/:id/parts/:partId', [verify_token_1.default, (0, validate_request_1.default)({ params: order_models_1.PartIdOrderId })], order_handler_1.default.removePartFromOrder);
// POST /api/v1/orders/:orderId/parts/:partId/status
router.post('/:id/parts/:partId/status', [verify_token_1.default, (0, validate_request_1.default)({ params: order_models_1.PartIdOrderId, body: order_models_1.OrderStatus })], order_handler_1.default.changeOrderPartStatus);
exports.default = router;
//# sourceMappingURL=order.routes.js.map