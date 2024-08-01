"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db");
const api_error_1 = require("../../utils/api-error");
const user_models_1 = require("../user/user.models");
const order_models_1 = require("./order.models");
/**
 * Returns orders from the database
 *
 * @returns {Promise<Order[]>} orders
 */
async function getOrders() {
    try {
        // Fetch orders
        const orders = (await db_1.db.select().from(order_models_1.orders).innerJoin(user_models_1.users, (0, drizzle_orm_1.eq)(order_models_1.orders.createdBy, user_models_1.users.id))).map((order) => {
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
            };
        });
        return orders;
    }
    catch (error) {
        throw error;
    }
}
/**
 * Returns user's orders from the database
 *
 * @returns {Promise<Order[]>} orders
 */
async function getUserOrders(id) {
    try {
        // Fetch orders
        const orders = (await db_1.db
            .select()
            .from(order_models_1.orders)
            .where((0, drizzle_orm_1.eq)(order_models_1.orders.createdBy, id))
            .innerJoin(user_models_1.users, (0, drizzle_orm_1.eq)(order_models_1.orders.createdBy, user_models_1.users.id))).map((order) => {
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
            };
        });
        return orders;
    }
    catch (error) {
        throw error;
    }
}
/**
 * Returns an order by its id
 *
 * @param {number} id
 */
async function getOrderById(id) {
    try {
        // Fetch order parts
        const parts = await db_1.db.select().from(order_models_1.orderParts).where((0, drizzle_orm_1.eq)(order_models_1.orderParts.orderId, id));
        // Fetch order
        const orders = (await db_1.db
            .select()
            .from(order_models_1.orders)
            .where((0, drizzle_orm_1.eq)(order_models_1.orders.id, id))
            .innerJoin(user_models_1.users, (0, drizzle_orm_1.eq)(order_models_1.orders.createdBy, user_models_1.users.id))).map((order) => {
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
            };
        });
        if (orders.length === 0) {
            throw (0, api_error_1.ApiErr)('Order is not exist', 404);
        }
        return orders[0];
    }
    catch (error) {
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
async function placeOrder(data, userId) {
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
        const [resultSet] = await db_1.db.insert(order_models_1.orders).values(newOrder);
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to create order', 500);
        }
        return resultSet.insertId;
    }
    catch (error) {
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
async function updateOrder(id, data) {
    try {
        const startPlan = new Date(data.startPlan);
        const finishPlan = new Date(data.finishPlan);
        const updatedOrder = {
            ...data,
            startPlan,
            finishPlan,
        };
        const [resultSet] = await db_1.db.update(order_models_1.orders).set(updatedOrder).where((0, drizzle_orm_1.eq)(order_models_1.orders.id, id));
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to update order', 500);
        }
    }
    catch (error) {
        throw error;
    }
}
/**
 * Delete an order from the database
 *
 * @param id
 * @returns Promise<void>
 */
async function deleteOrder(id) {
    try {
        const [resultSet] = await db_1.db.delete(order_models_1.orders).where((0, drizzle_orm_1.eq)(order_models_1.orders.id, id));
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to delete order', 500);
        }
    }
    catch (error) {
        throw error;
    }
}
/**
 * Changes order status
 *
 * @param id
 * @returns Promise<void>
 */
async function changeOrderStatus(id, data) {
    try {
        let updatedColumn = {
            status: data.status,
        };
        if (data.status === 'start') {
            updatedColumn.startActual = new Date();
        }
        if (data.status === 'finish') {
            updatedColumn.finishActual = new Date();
        }
        const [resultSet] = await db_1.db.update(order_models_1.orders).set(updatedColumn).where((0, drizzle_orm_1.eq)(order_models_1.orders.id, id));
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to change order status', 500);
        }
    }
    catch (error) {
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
async function addPartToOrder(orderId, data) {
    try {
        const partId = data.partId;
        const parts = await db_1.db.select().from(order_models_1.orderParts).where((0, drizzle_orm_1.eq)(order_models_1.orderParts.partId, partId));
        if (parts.length > 0) {
            throw (0, api_error_1.ApiErr)('Part is already added to the order', 400);
        }
        const startPlan = new Date(data.startPlan);
        const finishPlan = new Date(data.finishPlan);
        const newPart = {
            ...data,
            orderId,
            startPlan,
            finishPlan,
        };
        const [resultSet] = await db_1.db.insert(order_models_1.orderParts).values(newPart);
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to add part to order', 500);
        }
        return resultSet.insertId;
    }
    catch (error) {
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
async function updateOrderPart(orderId, partId, data) {
    try {
        const startPlan = new Date(data.startPlan);
        const finishPlan = new Date(data.finishPlan);
        const updatedPart = {
            ...data,
            startPlan,
            finishPlan,
        };
        const [resultSet] = await db_1.db
            .update(order_models_1.orderParts)
            .set(updatedPart)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(order_models_1.orderParts.orderId, orderId), (0, drizzle_orm_1.eq)(order_models_1.orderParts.partId, partId)));
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to update part', 500);
        }
    }
    catch (error) {
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
async function removePartFromOrder(orderId, partId) {
    try {
        const [resultSet] = await db_1.db
            .delete(order_models_1.orderParts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(order_models_1.orderParts.orderId, orderId), (0, drizzle_orm_1.eq)(order_models_1.orderParts.partId, partId)));
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to remove part from order', 500);
        }
    }
    catch (error) {
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
async function changeOrderPartStatus(orderId, partId, data) {
    try {
        let updatedColumn = {
            status: data.status,
        };
        if (data.status === 'start') {
            updatedColumn.startActual = new Date();
        }
        if (data.status === 'finish') {
            updatedColumn.finishActual = new Date();
        }
        const [resultSet] = await db_1.db
            .update(order_models_1.orderParts)
            .set(updatedColumn)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(order_models_1.orderParts.orderId, orderId), (0, drizzle_orm_1.eq)(order_models_1.orderParts.partId, partId)));
        if (resultSet.affectedRows === 0) {
            throw (0, api_error_1.ApiErr)('Failed to change order status', 500);
        }
    }
    catch (error) {
        throw error;
    }
}
exports.default = {
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
};
//# sourceMappingURL=order.service.js.map