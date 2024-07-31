import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { partSchema } from '../../models/part.model';

export const NewPart = createInsertSchema(partSchema, {
  partNumber: z.string().min(1).max(256),
  partName: z.string().min(1).max(256),
  quantity: z.number().int().min(0).default(0),
  quantityReq: z.number().int().min(0).default(0),
});

export type Part = typeof partSchema.$inferSelect;
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
