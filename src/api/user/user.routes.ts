import express from 'express';

import validateRequest from '../../middlewares/validate-request';
import verifyToken from '../../middlewares/verify-token';
import handler from './user.handler';
import { LoginData, NewUser } from './user.models';

const router = express.Router();

router.post('/login', validateRequest({ body: LoginData }), handler.login);
router.post('/register', validateRequest({ body: NewUser }), handler.register);
router.get('/me', verifyToken, handler.me);

export default router;
