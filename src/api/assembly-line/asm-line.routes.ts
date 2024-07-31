import express from 'express';
import verifyToken from '../../middlewares/verify-token';
import handler from './asm-line.handler';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Assembly Line routes');
});

// GET /api/v1/assembly-line/parts
router.get('/parts', verifyToken, handler.getAllParts);

// POST /api/v1/assembly-line/order
router.post('/order', verifyToken, handler.createOrder);

export default router;