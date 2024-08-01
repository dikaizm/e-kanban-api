import { int, mysqlEnum, mysqlTable, serial, timestamp } from 'drizzle-orm/mysql-core';
import { partSchema } from './part.model';
import { stationSchema } from './station.model';
import { users } from '../api/user/user.models';

export const orderSchema = mysqlTable('orders', {
  id: serial('id').primaryKey(),
  stationId: int('station_id').notNull().references(() => stationSchema.id),
  createdBy: int('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const orderStoreSchema = mysqlTable('orders_store', {
  id: serial('id').primaryKey(),
  orderId: int('order_id').notNull().references(() => orderSchema.id),
  partId: int('part_id').notNull().references(() => partSchema.id),
  quantity: int('quantity').notNull(),
  status: mysqlEnum('status', ['pending', 'production', 'deliver', 'finish']).notNull().default('production'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const orderFabricationSchema = mysqlTable('orders_fabrication', {
  id: serial('id').primaryKey(),
  orderId: int('order_id').notNull().references(() => orderSchema.id),
  partId: int('part_id').notNull().references(() => partSchema.id),
  quantity: int('quantity').notNull(),
  status: mysqlEnum('status', ['pending', 'deliver', 'finish']).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const deliverOrderFabricationSchema = mysqlTable('deliver_orders_fabrication', {
  id: serial('id').primaryKey(),
  orderFabId: int('order_fab_id').notNull().references(() => orderFabricationSchema.id),
  partId: int('part_id').notNull().references(() => partSchema.id),
  status: mysqlEnum('status', ['deliver', 'finish']).notNull().default('deliver'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});