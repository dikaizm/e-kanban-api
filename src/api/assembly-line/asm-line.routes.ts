import express from 'express';
import verifyToken from '../../middlewares/verify-token';
import handler from './asm-line.handler';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Assembly Line routes');
});

// GET /api/v1/assembly-line/parts
router.get('/parts', verifyToken, handler.getAllParts);

// GET /api/v1/assembly-line/part
router.get('/part/:id', verifyToken, handler.getPartById);

// PUT /api/v1/assembly-line/part
router.put('/part', verifyToken, handler.updatePartQuantity);

// POST /api/v1/assembly-line/order
router.post('/order', verifyToken, handler.createOrder);

// POST /api/v1/assembly-line/start
router.post('/parts/start', verifyToken, handler.startAssembleComponent);

// GET /api/v1/assembly-line/kanbans
router.get('/kanbans', verifyToken, handler.getAllKanbans);

export default router;