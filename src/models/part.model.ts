import { datetime, int, mysqlEnum, mysqlTable, serial, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { orderSchema } from './order.model';

export const partSchema = mysqlTable('parts', {
  id: serial('id').primaryKey(),
  partNumber: varchar('part_number', { length: 15 }).unique().notNull(),
  partName: varchar('part_name', { length: 256 }).notNull(),
  quantity: int('quantity').notNull().default(0),
  quantityReq: int('quantity_req').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const partStoreSchema = mysqlTable('parts_store', {
  id: serial('id').primaryKey(),
  partId: int('part_id').notNull().references(() => partSchema.id),
  stock: int('stock').notNull().default(0),
  status: mysqlEnum('status', ['idle', 'order_to_fabrication', 'receive']).notNull().default('idle'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const partShopFloorSchema = mysqlTable('parts_shop_floor', {
  id: serial('id').primaryKey(),
  partId: int('part_id').notNull().references(() => partSchema.id),
  orderId: int('order_id').notNull().references(() => orderSchema.id),
  planStart: datetime('plan_start', { mode: 'string' }),
  planFinish: datetime('plan_finish', { mode: 'string' }),
  actualStart: datetime('actual_start', { mode: 'string' }),
  actualFinish: datetime('actual_finish', { mode: 'string' }),
  status: mysqlEnum('status', ['pending', 'in_progress', 'finish']).notNull().default('pending'),
  station: mysqlEnum('station', ['shop_floor']).notNull().default('shop_floor'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const componentSchema = mysqlTable('components', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  quantity: int('quantity').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const partComponentSchema = mysqlTable('parts_component', {
  id: serial('id').primaryKey(),
  partId: int('part_id').notNull().references(() => partSchema.id),
  componentId: int('component_id').notNull().references(() => componentSchema.id),
});