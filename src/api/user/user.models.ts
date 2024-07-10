import { mysqlEnum, mysqlTable, serial, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';

const userRoles = ['assembly_line_operator', 'assembly_store_operator', 'fabrication_operator', 'manager'] as const;

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).unique().notNull(),
  role: mysqlEnum('role', userRoles).notNull(),
  password: varchar('password', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const NewUser = createInsertSchema(users, {
  name: z.string().min(1).max(256),
  email: z.string().email().min(1).max(256),
  role: z.enum(userRoles),
  password: z.string().min(1).max(256),
});

export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof NewUser>;

export const LoginData = z.object({
  email: z.string().email().min(1).max(256),
  password: z.string().min(1).max(256),
});

export type LoginData = z.infer<typeof LoginData>;

export type UserVerified = {
  id: number;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
};
