import express from 'express';

import apiResponse from '../utils/api-response';
import authRoutes from './user/user.routes';
import assemblyLineRoutes from './assembly-line/asm-line.routes';
import assemblyStoreRoutes from './assembly-store/asm-store.routes';

const router = express.Router();

router.get('/', (req, res) => {
  res.send(apiResponse.success('The API is live!', null));
});

router.use(authRoutes);
// router.use('/parts', partRoutes);
// router.use('/orders', orderRoutes);
router.use('/assembly-line', assemblyLineRoutes);
router.use('/assembly-store', assemblyStoreRoutes);

export default router;
