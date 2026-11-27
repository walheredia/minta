import { z } from 'zod';
import { categoryRefSchema } from '../expense-categories/category-ref.schema.js';
import { detailSchema } from './expense-fields.schema.js';

export const createExpenseSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0.'),
  currency: z.enum(['ARS', 'USD']),
  category: categoryRefSchema,
  detail: detailSchema.optional(),
  occurredAt: z.coerce.date(),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
