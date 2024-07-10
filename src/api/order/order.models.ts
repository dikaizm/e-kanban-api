import { datetime, int, mysqlTable, serial, text, timestamp, varchar } from 'drizzle-orm/mysql-core';
import z from 'zod';

import { parts } from '../part/part.models';
import { User, users } from '../user/user.models';
import { createInsertSchema } from 'drizzle-zod';

// Orders
export const orders = mysqlTable('orders', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  status: varchar('status', { length: 256 }).notNull(),
  qty: int('qty').notNull(),
  createdBy: int('created_by')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  startPlan: datetime('start_plan').notNull(),
  finishPlan: datetime('finish_plan').notNull(),
  startActual: datetime('start_actual'),
  finishActual: datetime('finish_actual'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const NewOrder = createInsertSchema(orders, {
  description: z.string().min(1),
  startPlan: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  finishPlan: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  qty: z.number().int().positive(),
  status: z.string().min(1).default('queue'),
  createdBy: z.number().int().positive().default(1),
});

export const UpdateOrder = z.object({
  description: z.string().min(1),
  startPlan: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  finishPlan: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  qty: z.number().int().positive(),
});

export const OrderId = z.object({
  id: z
    .string()
    .min(1)
    .refine((id) => !isNaN(parseInt(id)), { message: 'Invalid order id' }),
});

export const OrderStatus = z.object({
  status: z.string().min(1),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = z.infer<typeof NewOrder>;
export type UpdateOrder = z.infer<typeof UpdateOrder>;
export type OrderWithUser = { createdBy: User } & Order;
export type OrderWithUserPart = { createdBy: User; parts: OrderPart[] } & Order;
export type OrderStatus = z.infer<typeof OrderStatus>;

// Order Parts
export const orderParts = mysqlTable('order_parts', {
  id: serial('id').primaryKey(),
  orderId: int('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  partId: int('part_id')
    .references(() => parts.id, { onDelete: 'cascade' })
    .notNull(),
  qty: int('qty').notNull(),
  status: varchar('status', { length: 256 }).notNull(),
  stationList: varchar('station_list', { length: 256 }).notNull(),
  startPlan: datetime('start_plan').notNull(),
  finishPlan: datetime('finish_plan').notNull(),
  startActual: datetime('start_actual'),
  finishActual: datetime('finish_actual'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const NewOrderPart = createInsertSchema(orderParts, {
  orderId: z.number().int().positive().default(1),
  partId: z.number().int().positive(),
  qty: z.number().int().positive(),
  status: z.string().min(1),
  stationList: z.string().min(1),
  startPlan: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  finishPlan: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});

export const UpdateOrderPart = z.object({
  stationList: z.string().min(1),
  startPlan: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  finishPlan: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  qty: z.number().int().positive(),
});

export const PartIdOrderId = z.object({
  id: z
    .string()
    .min(1)
    .refine((id) => !isNaN(parseInt(id)), { message: 'Invalid order id' }),
  partId: z
    .string()
    .min(1)
    .refine((id) => !isNaN(parseInt(id)), { message: 'Invalid part id' }),
});

export type OrderPart = typeof orderParts.$inferSelect;
export type NewOrderPart = z.infer<typeof NewOrderPart>;
export type UpdateOrderPart = z.infer<typeof UpdateOrderPart>;
