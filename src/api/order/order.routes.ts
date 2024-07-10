import express from 'express';

import validateRequest from '../../middlewares/validate-request';
import verifyToken from '../../middlewares/verify-token';
import handler from './order.handler';
import {
  NewOrder,
  NewOrderPart,
  OrderId,
  OrderStatus,
  PartIdOrderId,
  UpdateOrder,
  UpdateOrderPart,
} from './order.models';

const router = express.Router();

// GET /api/v1/orders
router.get('/', [verifyToken], handler.getAllOrders);

// POST /api/v1/orders
router.post('/', [verifyToken, validateRequest({ body: NewOrder })], handler.createOrder);

// GET /api/v1/orders/:id
router.get('/:id', [verifyToken, validateRequest({ params: OrderId })], handler.getOrderById);

// PATCH /api/v1/orders/:id
router.patch('/:id', [verifyToken, validateRequest({ params: OrderId, body: UpdateOrder })], handler.updateOrder);

// DELETE /api/v1/orders/:id
router.delete('/:id', [verifyToken, validateRequest({ params: OrderId })], handler.deleteOrder);

// POST /api/v1/order/:id/status
router.post(
  '/:id/status',
  [verifyToken, validateRequest({ params: OrderId, body: OrderStatus })],
  handler.changeOrderStatus,
);

// POST /api/v1/orders/:id/parts
router.post(
  '/:id/parts',
  [verifyToken, validateRequest({ params: OrderId, body: NewOrderPart })],
  handler.addPartToOrder,
);

// PATCH /api/v1/orders/:orderId/parts/:partId
router.patch(
  '/:id/parts/:partId',
  [verifyToken, validateRequest({ params: PartIdOrderId, body: UpdateOrderPart })],
  handler.updateOrderPart,
);

// DELETE /api/v1/orders/:orderId/parts/:partId
router.delete(
  '/:id/parts/:partId',
  [verifyToken, validateRequest({ params: PartIdOrderId })],
  handler.removePartFromOrder,
);

// POST /api/v1/orders/:orderId/parts/:partId/status
router.post(
  '/:id/parts/:partId/status',
  [verifyToken, validateRequest({ params: PartIdOrderId, body: OrderStatus })],
  handler.changeOrderPartStatus,
);

export default router;
