"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_response_1 = __importDefault(require("../../utils/api-response"));
const order_service_1 = __importDefault(require("./order.service"));
const decode_token_1 = require("../../utils/decode-token");
async function getAllOrders(req, res, next) {
    try {
        const orders = await order_service_1.default.getOrders();
        res.json(api_response_1.default.success('Orders retrieved successfully', orders));
    }
    catch (error) {
        next(error);
    }
}
async function getOrderById(req, res, next) {
    try {
        const { id } = req.params;
        const order = await order_service_1.default.getOrderById(parseInt(id));
        res.json(api_response_1.default.success('Order retrieved successfully', order));
    }
    catch (error) {
        next(error);
    }
}
async function createOrder(req, res, next) {
    try {
        const user = (0, decode_token_1.decodeToken)(req.headers.authorization);
        const data = req.body;
        const orderId = await order_service_1.default.placeOrder(data, user.id);
        res.status(201).json(api_response_1.default.success('Order created successfully', { orderId }));
    }
    catch (error) {
        next(error);
    }
}
async function updateOrder(req, res, next) {
    try {
        const { id } = req.params;
        const data = req.body;
        await order_service_1.default.updateOrder(parseInt(id), data);
        res.json(api_response_1.default.success('Order updated successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function deleteOrder(req, res, next) {
    try {
        const { id } = req.params;
        await order_service_1.default.deleteOrder(parseInt(id));
        res.json(api_response_1.default.success('Order deleted successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function changeOrderStatus(req, res, next) {
    try {
        const { id } = req.params;
        const data = req.body;
        await order_service_1.default.changeOrderStatus(parseInt(id), data);
        res.json(api_response_1.default.success('Order status changed successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function addPartToOrder(req, res, next) {
    try {
        const { id } = req.params;
        const data = req.body;
        await order_service_1.default.addPartToOrder(parseInt(id), data);
        res.json(api_response_1.default.success('Part added to order successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function updateOrderPart(req, res, next) {
    try {
        const { id, partId } = req.params;
        const data = req.body;
        await order_service_1.default.updateOrderPart(parseInt(id), parseInt(partId), data);
        res.json(api_response_1.default.success('Part updated successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function removePartFromOrder(req, res, next) {
    try {
        const { id, partId } = req.params;
        await order_service_1.default.removePartFromOrder(parseInt(id), parseInt(partId));
        res.json(api_response_1.default.success('Part removed from order successfully', null));
    }
    catch (error) {
        next(error);
    }
}
async function changeOrderPartStatus(req, res, next) {
    try {
        const { id, partId } = req.params;
        const data = req.body;
        await order_service_1.default.changeOrderPartStatus(parseInt(id), parseInt(partId), data);
        res.json(api_response_1.default.success('Part status changed successfully', null));
    }
    catch (error) {
        next(error);
    }
}
exports.default = {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    changeOrderStatus,
    addPartToOrder,
    updateOrderPart,
    removePartFromOrder,
    changeOrderPartStatus,
};
//# sourceMappingURL=order.handler.js.map