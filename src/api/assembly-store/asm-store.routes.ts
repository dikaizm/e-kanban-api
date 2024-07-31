import express from 'express';
import handler from './asm-store.handler';
import verifyToken from '../../middlewares/verify-token';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Assembly Line routes');
});

// GET /api/v1/assembly-line/orders
router.get('/orders', verifyToken, handler.getAllOrders);

// POST /api/v1/assembly-line/orders/status
router.post('/orders/status', verifyToken, handler.updateOrderStatus);

export default router;