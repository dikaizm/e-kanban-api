import express from 'express';

import apiResponse from '../utils/api-response';
import orderRoutes from './order/order.routes';
import partRoutes from './part/part.routes';
import authRoutes from './user/user.routes';

const router = express.Router();

router.get('/', (req, res) => {
  res.send(apiResponse.success('The API is live!', null));
});

router.use(authRoutes);
router.use('/parts', partRoutes);
router.use('/orders', orderRoutes);

export default router;
