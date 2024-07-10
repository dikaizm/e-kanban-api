import type { NextFunction, Request, Response } from 'express';

import apiResponse from '../../utils/api-response';
import type HandlerFunction from '../../utils/handler-function';
import { OrderStatus, UpdateOrder, UpdateOrderPart, type NewOrder } from './order.models';
import service from './order.service';
import { decodeToken } from '../../utils/decode-token';

interface OrderHandler {
  getAllOrders: HandlerFunction;
  getOrderById: HandlerFunction;
  createOrder: HandlerFunction;
  updateOrder: HandlerFunction;
  deleteOrder: HandlerFunction;
  addPartToOrder: HandlerFunction;
  updateOrderPart: HandlerFunction;
  removePartFromOrder: HandlerFunction;
  changeOrderStatus: HandlerFunction;
  changeOrderPartStatus: HandlerFunction;
}

async function getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await service.getOrders();

    res.json(apiResponse.success('Orders retrieved successfully', orders));
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const order = await service.getOrderById(parseInt(id));

    res.json(apiResponse.success('Order retrieved successfully', order));
  } catch (error) {
    next(error);
  }
}

async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = decodeToken(req.headers.authorization!);
    const data: NewOrder = req.body;

    const orderId = await service.placeOrder(data, user.id);

    res.status(201).json(apiResponse.success('Order created successfully', { orderId }));
  } catch (error) {
    next(error);
  }
}

async function updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdateOrder = req.body;

    await service.updateOrder(parseInt(id), data);

    res.json(apiResponse.success('Order updated successfully', null));
  } catch (error) {
    next(error);
  }
}

async function deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    await service.deleteOrder(parseInt(id));

    res.json(apiResponse.success('Order deleted successfully', null));
  } catch (error) {
    next(error);
  }
}

async function changeOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data: OrderStatus = req.body;

    await service.changeOrderStatus(parseInt(id), data);

    res.json(apiResponse.success('Order status changed successfully', null));
  } catch (error) {
    next(error);
  }
}

async function addPartToOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const data = req.body;

    await service.addPartToOrder(parseInt(id), data);

    res.json(apiResponse.success('Part added to order successfully', null));
  } catch (error) {
    next(error);
  }
}

async function updateOrderPart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, partId } = req.params;
    const data: UpdateOrderPart = req.body;

    await service.updateOrderPart(parseInt(id), parseInt(partId), data);

    res.json(apiResponse.success('Part updated successfully', null));
  } catch (error) {
    next(error);
  }
}

async function removePartFromOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, partId } = req.params;

    await service.removePartFromOrder(parseInt(id), parseInt(partId));

    res.json(apiResponse.success('Part removed from order successfully', null));
  } catch (error) {
    next(error);
  }
}

async function changeOrderPartStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, partId } = req.params;
    const data: OrderStatus = req.body;

    await service.changeOrderPartStatus(parseInt(id), parseInt(partId), data);

    res.json(apiResponse.success('Part status changed successfully', null));
  } catch (error) {
    next(error);
  }
}

export default {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  changeOrderStatus,
  addPartToOrder,
  updateOrderPart,
  removePartFromOrder,
  changeOrderPartStatus,
} satisfies OrderHandler;
