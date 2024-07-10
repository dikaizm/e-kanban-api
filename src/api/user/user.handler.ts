import { NextFunction, Request, Response } from 'express';

import apiResponse from '../../utils/api-response';
import HandlerFunction from '../../utils/handler-function';
import { LoginData, NewUser } from './user.models';
import service from './user.service';

interface UserHandler {
  login: HandlerFunction;
  register: HandlerFunction;
  me: HandlerFunction;
}

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: LoginData = req.body;

    const token = await service.login(data);

    res.json(apiResponse.success('Login success', { token }));
  } catch (error) {
    next(error);
  }
}

async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: NewUser = req.body;
    const { email, password } = data;

    await service.register(data);

    const token = await service.login({ email, password });

    res.status(201).json(apiResponse.success('Register success', { token }));
  } catch (error) {
    next(error);
  }
}

async function me(req: Request, res: Response): Promise<void> {
  res.send(apiResponse.success('You are authorized!', req.body.user));
}

export default {
  login,
  register,
  me,
} satisfies UserHandler;
