import { datetime, int, mysqlEnum, mysqlTable, serial, text, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { orderSchema } from './order.model';
import { stationSchema } from './station.model';

export const kanbanSchema = mysqlTable('kanbans', {
  id: varchar('id', { length: 16 }).primaryKey(),
  type: mysqlEnum('type', ['production', 'withdrawal']).notNull(),
  cardId: mysqlEnum('card_id', ['RYIN001', 'RYIN002']).notNull(),
  status: mysqlEnum('status', ['queue', 'progress', 'done']).notNull().default('queue'),
  qrCode: text('qr_code').notNull(),
  orderId: int('order_id').notNull().references(() => orderSchema.id),
  orderDate: datetime('order_date', { mode: 'string' }).notNull(),
  finishDate: datetime('finish_date', { mode: 'string' }),
  planStart: datetime('plan_start', { mode: 'string' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const kanbanWithdrawalSchema = mysqlTable('kanbans_withdrawal', {
  id: serial('id').primaryKey(),
  kanbanId: varchar('kanban_id', { length: 16 }).notNull().references(() => kanbanSchema.id),
  prevStation: int('prev_station').notNull().references(() => stationSchema.id),
  nextStation: int('next_station').notNull().references(() => stationSchema.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});