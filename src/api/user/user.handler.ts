import { NextFunction, Request, Response } from 'express';

import apiResponse from '../../utils/api-response';
import HandlerFunction from '../../utils/handler-function';
import { AuthResponse, LoginData, NewUser, RegisterData } from './user.models';
import service from './user.service';
import authConfig from '../../config/auth';

interface UserHandler {
  login: HandlerFunction;
  register: HandlerFunction;
  me: HandlerFunction;
}

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: LoginData = req.body;

    const authRes = await service.login(data);

    res.json(apiResponse.success('Login success', authRes));
  } catch (error) {
    next(error);
  }
}

async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: RegisterData = req.body;
    const { email, password, confirmPassword, registerKey } = data;

    if (password !== confirmPassword) {
      res.status(400).json(apiResponse.error('Password and confirm password must be the same'));
      return;
    }

    if (registerKey != authConfig.secret) {
      res.status(400).json(apiResponse.error('Invalid register key'));
      return;
    }

    const newUser: NewUser = {
      name: data.name,
      email,
      role: data.role,
      password,
    };

    await service.register(newUser);

    const loginRes = await service.login({ email, password });

    const authRes: AuthResponse = {
      token: loginRes.token,
      user: {
        name: loginRes.user.name,
        email: loginRes.user.email,
        role: loginRes.user.role,
      },
    };

    res.status(201).json(apiResponse.success('Register success', authRes));
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
