import { and, eq } from 'drizzle-orm';

import { db } from '../../db';
import { ApiErr } from '../../utils/api-error';
import { users as userSchema } from '../user/user.models';
import {
  NewOrder,
  NewOrderPart,
  OrderPart,
  orderParts,
  orders as orderSchema,
  OrderStatus,
  OrderWithUser,
  OrderWithUserPart,
  UpdateOrder,
  UpdateOrderPart,
} from './order.models';

interface OrderService {
  getOrders(): Promise<OrderWithUser[]>;
  getUserOrders(id: number): Promise<OrderWithUser[]>;
  getOrderById(id: number): Promise<OrderWithUserPart>;
  placeOrder(order: NewOrder, userId: number): Promise<number>;
  updateOrder(id: number, order: UpdateOrder): Promise<void>;
  deleteOrder(id: number): Promise<void>;
  changeOrderStatus(id: number, data: OrderStatus): Promise<void>;
  addPartToOrder(orderId: number, data: NewOrderPart): Promise<number>;
  updateOrderPart(orderId: number, partId: number, data: UpdateOrderPart): Promise<void>;
  removePartFromOrder(orderId: number, partId: number): Promise<void>;
  changeOrderPartStatus(orderId: number, partId: number, data: OrderStatus): Promise<void>;
}

/**
 * Returns orders from the database
 *
 * @returns {Promise<Order[]>} orders
 */
async function getOrders(): Promise<OrderWithUser[]> {
  try {
    // Fetch orders
    const orders = (
      await db.select().from(orderSchema).innerJoin(userSchema, eq(orderSchema.createdBy, userSchema.id))
    ).map((order) => {
      return {
        // Put the order data into the order object
        ...order.orders,

        // Put the user data into the createdBy object
        createdBy: {
          id: order.users.id,
          email: order.users.email,
          name: order.users.name,
          role: order.users.role,
        },
      } as OrderWithUser;
    });

    return orders;
  } catch (error) {
    throw error;
  }
}

/**
 * Returns user's orders from the database
 *
 * @returns {Promise<Order[]>} orders
 */
async function getUserOrders(id: number): Promise<OrderWithUser[]> {
  try {
    // Fetch orders
    const orders = (
      await db
        .select()
        .from(orderSchema)
        .where(eq(orderSchema.createdBy, id))
        .innerJoin(userSchema, eq(orderSchema.createdBy, userSchema.id))
    ).map((order) => {
      return {
        // Put the order data into the order object
        ...order.orders,

        // Put the user data into the createdBy object
        createdBy: {
          id: order.users.id,
          email: order.users.email,
          name: order.users.name,
          role: order.users.role,
        },
      } as OrderWithUser;
    });

    return orders;
  } catch (error) {
    throw error;
  }
}

/**
 * Returns an order by its id
 *
 * @param {number} id
 */
async function getOrderById(id: number): Promise<OrderWithUserPart> {
  try {
    // Fetch order parts
    const parts = await db.select().from(orderParts).where(eq(orderParts.orderId, id));

    // Fetch order
    const orders = (
      await db
        .select()
        .from(orderSchema)
        .where(eq(orderSchema.id, id))
        .innerJoin(userSchema, eq(orderSchema.createdBy, userSchema.id))
    ).map((order) => {
      return {
        // Put the order data into the order object
        ...order.orders,

        // Put the user data into the createdBy object
        createdBy: {
          id: order.users.id,
          email: order.users.email,
          name: order.users.name,
          role: order.users.role,
        },

        // Put the order parts into the parts object as an array
        parts,
      } as OrderWithUserPart;
    });

    if (orders.length === 0) {
      throw ApiErr('Order is not exist', 404);
    }

    return orders[0];
  } catch (error) {
    throw error;
  }
}

/**
 * Insert new order in the database
 *
 * @param {NewOrder} data
 * @param {number} userId
 * @returns Promise<number>
 */
async function placeOrder(data: NewOrder, userId: number): Promise<number> {
  try {
    const startPlan = new Date(data.startPlan);
    const finishPlan = new Date(data.finishPlan);
    const status = 'queue';
    const newOrder = {
      ...data,
      startPlan,
      finishPlan,
      status,
      createdBy: userId,
    };

    const [resultSet] = await db.insert(orderSchema).values(newOrder);

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to create order', 500);
    }

    return resultSet.insertId;
  } catch (error) {
    throw error;
  }
}

/**
 * Update order in the database
 *
 * @param {number} id
 * @param {NewOrder} data
 * @returns Promise<void>
 */
async function updateOrder(id: number, data: UpdateOrder): Promise<void> {
  try {
    const startPlan = new Date(data.startPlan);
    const finishPlan = new Date(data.finishPlan);
    const updatedOrder = {
      ...data,
      startPlan,
      finishPlan,
    };

    const [resultSet] = await db.update(orderSchema).set(updatedOrder).where(eq(orderSchema.id, id));

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to update order', 500);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Delete an order from the database
 *
 * @param id
 * @returns Promise<void>
 */
async function deleteOrder(id: number): Promise<void> {
  try {
    const [resultSet] = await db.delete(orderSchema).where(eq(orderSchema.id, id));

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to delete order', 500);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Changes order status
 *
 * @param id
 * @returns Promise<void>
 */
async function changeOrderStatus(id: number, data: OrderStatus): Promise<void> {
  try {
    let updatedColumn: any = {
      status: data.status,
    };

    if (data.status === 'start') {
      updatedColumn.startActual = new Date();
    }

    if (data.status === 'finish') {
      updatedColumn.finishActual = new Date();
    }

    const [resultSet] = await db.update(orderSchema).set(updatedColumn).where(eq(orderSchema.id, id));

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to change order status', 500);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Add part to order
 * 
 * @param orderId 
 * @param data 
 * @returns Promise<number>
 */
async function addPartToOrder(orderId: number, data: NewOrderPart): Promise<number> {
  try {
    const partId = data.partId;
    const parts: OrderPart[] = await db.select().from(orderParts).where(eq(orderParts.partId, partId));

    if (parts.length > 0) {
      throw ApiErr('Part is already added to the order', 400);
    }

    const startPlan = new Date(data.startPlan);
    const finishPlan = new Date(data.finishPlan);
    const newPart = {
      ...data,
      orderId,
      startPlan,
      finishPlan,
    };

    const [resultSet] = await db.insert(orderParts).values(newPart);

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to add part to order', 500);
    }

    return resultSet.insertId;
  } catch (error) {
    throw error;
  }
}

/**
 * Update order part
 * 
 * @param orderId 
 * @param partId 
 * @param data 
 * @returns Promise<void>
 */
async function updateOrderPart(orderId: number, partId: number, data: UpdateOrderPart) {
  try {
    const startPlan = new Date(data.startPlan);
    const finishPlan = new Date(data.finishPlan);
    const updatedPart = {
      ...data,
      startPlan,
      finishPlan,
    };

    const [resultSet] = await db
      .update(orderParts)
      .set(updatedPart)
      .where(and(eq(orderParts.orderId, orderId), eq(orderParts.partId, partId)));

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to update part', 500);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Remove part from order
 * 
 * @param orderId 
 * @param partId 
 * @returns Promise<void>
 */
async function removePartFromOrder(orderId: number, partId: number): Promise<void> {
  try {
    const [resultSet] = await db
      .delete(orderParts)
      .where(and(eq(orderParts.orderId, orderId), eq(orderParts.partId, partId)));

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to remove part from order', 500);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Change order part status
 * 
 * @param orderId 
 * @param partId 
 * @param data 
 * @returns Promise<void>
 */
async function changeOrderPartStatus(orderId: number, partId: number, data: OrderStatus): Promise<void> {
  try {
    let updatedColumn: any = {
      status: data.status,
    };

    if (data.status === 'start') {
      updatedColumn.startActual = new Date();
    }

    if (data.status === 'finish') {
      updatedColumn.finishActual = new Date();
    }

    const [resultSet] = await db
      .update(orderParts)
      .set(updatedColumn)
      .where(and(eq(orderParts.orderId, orderId), eq(orderParts.partId, partId)));

    if (resultSet.affectedRows === 0) {
      throw ApiErr('Failed to change order status', 500);
    }
  } catch (error) {
    throw error;
  }
}

export default {
  getOrders,
  getUserOrders,
  getOrderById,
  placeOrder,
  updateOrder,
  deleteOrder,
  changeOrderStatus,
  addPartToOrder,
  updateOrderPart,
  removePartFromOrder,
  changeOrderPartStatus,
} satisfies OrderService;
