import { z } from 'zod';

export const updateExpenseSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0.').optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
  description: z.string().min(1, 'La descripción es obligatoria.').optional(),
  occurredAt: z.coerce.date().optional(),
});

export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
