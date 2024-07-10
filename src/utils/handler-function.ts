import { NextFunction, Request, Response } from 'express';

type HandlerFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export default HandlerFunction;