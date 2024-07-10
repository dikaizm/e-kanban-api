import express from 'express';

import validateRequest from '../../middlewares/validate-request';
import verifyToken from '../../middlewares/verify-token';
import handler from './part.handler';
import { NewPart, PartId } from './part.models';

const router = express.Router();

// GET /api/v1/parts
router.get('/', verifyToken, handler.getAllParts);

// POST /api/v1/parts
router.post('/', [verifyToken, validateRequest({ body: NewPart })], handler.createPart);

// GET /api/v1/parts/:id
router.get('/:id', [verifyToken, validateRequest({ params: PartId })], handler.getPartById);

// PATCH /api/v1/parts/:id
router.patch('/:id', [verifyToken, validateRequest({ params: PartId, body: NewPart })], handler.updatePart);

// DELETE /api/v1/parts/:id
router.delete('/:id', [verifyToken, validateRequest({ params: PartId })], handler.deletePart);

export default router;
