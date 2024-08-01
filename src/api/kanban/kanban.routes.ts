import express from 'express';
import verifyToken from '../../middlewares/verify-token';
import handler from './kanban.handler';

const router = express.Router();

// GET /api/v1/kanban/:id
router.get('/:id', verifyToken, handler.getKanbanById);

// PUT /api/v1/kanban/confirm
router.put('/confirm', verifyToken, handler.updateKanbanStatus);

export default router;