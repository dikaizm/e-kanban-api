import { verify } from 'jsonwebtoken';

import { UserVerified } from '../api/user/user.models';
import authConfig from '../config/auth';
import { ApiErr } from './api-error';

export function decodeToken(authHeader: string): UserVerified {
  const token = authHeader.split(' ')[1];

  if (!token) {
    throw ApiErr('Unauthorized', 401);
  }

  let user: UserVerified;

  verify(token, authConfig.secret, function (err, decoded) {
    if (err) {
      throw ApiErr(err.message, 401);
    }

    user = decoded as UserVerified;
  });

  return user!;
}
