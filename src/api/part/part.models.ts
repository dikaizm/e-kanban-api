import { mysqlTable, serial, text, timestamp, varchar } from 'drizzle-orm/mysql-core';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';

export const parts = mysqlTable('parts', {
  id: serial('id').primaryKey(),
  partNumber: varchar('part_number', { length: 15 }).unique().notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const NewPart = createInsertSchema(parts, {
  partNumber: z.string().min(1).max(15).refine((partNumber) => {
    // Part number must be in the format of 1234.5678.9101
    // e.g. 1234.5678.9101
    const nums = partNumber.split('.');
    return nums.length === 3 && nums.every((part) => !isNaN(parseInt(part)));
  }, {
    message: 'Invalid part number. Must be in the format of xxxx.xxxx.xxxx',
  }),
  name: z.string().min(1).max(256),
  description: z.string().min(1),
});

export type Part = typeof parts.$inferSelect;
export type NewPart = z.infer<typeof NewPart>;

export const PartId = z.object({
  id: z
    .string()
    .min(1)
    .refine((id) => !isNaN(parseInt(id)), {
      message: 'Invalid part id',
    }),
});
export type PartId = z.infer<typeof PartId>;
