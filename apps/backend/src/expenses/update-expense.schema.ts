import { z } from 'zod';
import { categoryRefSchema } from '../expense-categories/category-ref.schema.js';
import { detailSchema } from './expense-fields.schema.js';

export const updateExpenseSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0.').optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
  category: categoryRefSchema.optional(),
  detail: detailSchema.optional(),
  occurredAt: z.coerce.date().optional(),
});

export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
