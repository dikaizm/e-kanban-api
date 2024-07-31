import { mysqlTable, serial, timestamp, varchar } from 'drizzle-orm/mysql-core';

export const stationSchema = mysqlTable('stations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});