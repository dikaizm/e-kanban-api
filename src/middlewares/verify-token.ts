import { NextFunction, Request, Response } from 'express';

import userService from '../api/user/user.service';
import { decodeToken } from '../utils/decode-token';

export default function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const headerAuth = req.headers.authorization;

    if (!headerAuth) {
      res.status(401);
      throw Error('Unauthorized');
    }

    const user = decodeToken(headerAuth);
    const newToken = userService.refreshToken(user);

    res.cookie('auth', newToken, { maxAge: 24 * 3600 * 1000, httpOnly: true });

    req.body.user = user!;

    next();
  } catch (error) {
    next(error);
  }
}
