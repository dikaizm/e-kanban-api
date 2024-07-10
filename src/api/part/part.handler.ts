import { NextFunction, Request, Response } from 'express';

import apiResponse from '../../utils/api-response';
import HandlerFunction from '../../utils/handler-function';
import { NewPart } from './part.models';
import partService from './part.service';

interface PartHandler {
  getAllParts: HandlerFunction;
  getPartById: HandlerFunction;
  createPart: HandlerFunction;
  updatePart: HandlerFunction;
  deletePart: HandlerFunction;
}

async function getAllParts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parts = await partService.getParts();

    res.send(apiResponse.success('Parts retrieved successfully', parts));
  } catch (error) {
    next(error);
  }
}

async function getPartById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const part = await partService.getPartById(parseInt(id));

    res.send(apiResponse.success('Part retrieved successfully', part));
  } catch (error) {
    next(error);
  }
}

async function createPart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: NewPart = req.body;

    const partId = await partService.createPart(data);

    res.send(apiResponse.success('Part created successfully', { inserted_id: partId }));
  } catch (error) {
    next(error);
  }
}

async function updatePart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data: NewPart = req.body;

    await partService.updatePart(parseInt(id), data);

    res.send(apiResponse.success('Part updated successfully', null));
  } catch (error) {
    next(error);
  }
}

async function deletePart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    await partService.deletePart(parseInt(id));

    res.send(apiResponse.success('Part deleted successfully', null));
  } catch (error) {
    next(error);
  }
}

export default {
  getAllParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
} satisfies PartHandler;
