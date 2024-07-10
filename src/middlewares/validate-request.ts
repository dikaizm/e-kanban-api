import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

import { ApiErr } from '../utils/api-error';

type RequestValidator = {
  params?: AnyZodObject;
  body?: AnyZodObject;
  query?: AnyZodObject;
};

export default function validateRequest(validators: RequestValidator) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (validators.params) {
        req.params = await validators.params.parseAsync(req.params);
      }

      if (validators.body) {
        req.body = await validators.body.parseAsync(req.body);
      }

      if (validators.query) {
        req.query = await validators.query.parseAsync(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422);

        if (error.errors[0].message == 'Required') {
          error = ApiErr(`Field '${error.issues[0].path[0]}' is ${error.issues[0].message.toLowerCase()}`, 422);
        } else {
          error = ApiErr(error.errors[0].message, 422);
        }
      }

      next(error);
    }
  };
}
