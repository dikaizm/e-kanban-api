import express from 'express';
import verifyToken from '../../middlewares/verify-token';
import handler from './asm-fabrication.handler';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Fabrication routes');
});

// GET /api/v1/fabrication/orders
router.get('/orders', verifyToken, handler.getAllOrders);

// GET /api/v1/fabrication/orders/deliver/:orderId
router.get('/orders/deliver/:orderId', verifyToken, handler.deliverOrder);

// GET /api/v1/fabrication/shop-floors
router.get('/shop-floors', verifyToken, handler.getAllShopFloors);

// GET /api/v1/fabrication/shop-floors/:id
router.get('/shop-floors/:id', verifyToken, handler.getShopFloorById);

// PUT /api/v1/fabrication/shop-floors/plan
router.put('/shop-floors/plan', verifyToken, handler.editPlanShopFloor);

// PUT /api/v1/fabrication/shop-floors/status
router.put('/shop-floors/status', verifyToken, handler.updateStatusShopFloor);

// GET /api/v1/fabrication/kanbans
router.get('/kanbans', verifyToken, handler.getAllKanbans);

export default router;