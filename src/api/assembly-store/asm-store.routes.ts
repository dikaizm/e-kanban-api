import express from 'express';
import handler from './asm-store.handler';
import verifyToken from '../../middlewares/verify-token';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Assembly Line routes');
});

// GET /api/v1/assembly-store/orders
router.get('/orders', verifyToken, handler.getAllOrders);

// POST /api/v1/assembly-store/orders/status
router.post('/orders/status', verifyToken, handler.updateOrderStatus);

// GET /api/v1/assembly-store/parts
router.get('/parts', verifyToken, handler.getAllParts);

export default router;