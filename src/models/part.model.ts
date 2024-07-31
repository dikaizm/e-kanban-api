import { int, mysqlEnum, mysqlTable, serial, timestamp, varchar } from 'drizzle-orm/mysql-core';

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
  status: mysqlEnum('status', ['order_to_fabrication', 'finish']).notNull().default('order_to_fabrication'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const partShopFloorSchema = mysqlTable('parts_shop_floor', {
  id: serial('id').primaryKey(),
  partId: int('part_id').notNull().references(() => partSchema.id),
  planStart: timestamp('plan_start').notNull(),
  planFinish: timestamp('plan_finish').notNull(),
  actualStart: timestamp('actual_start'),
  actualFinish: timestamp('actual_finish'),
  station: mysqlEnum('station', ['shop_floor']).notNull().default('shop_floor'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});