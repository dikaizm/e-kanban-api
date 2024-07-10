import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../utils/api-error';
import { ErrorResponse } from '../utils/api-response';

export default function errorHandler(
  err: ApiError | Error,
  req: Request,
  res: Response<ErrorResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);

  if (err instanceof ApiError) {
    res.status(err.statusCode);
  }

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
}
