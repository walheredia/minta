import { z } from 'zod';

export const createExpenseSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0.'),
  currency: z.enum(['ARS', 'USD']),
  description: z.string().min(1, 'La descripción es obligatoria.'),
  occurredAt: z.coerce.date(),
});

export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
