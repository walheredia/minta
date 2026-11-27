import { z } from 'zod';

/** Reference to the Expense Category an Expense is classified under. */
export const categoryRefSchema = z.discriminatedUnion(
  'source',
  [z.object({ source: z.literal('SYSTEM'), id: z.string().min(1) })],
  { error: 'Elegí o creá un tipo de gasto.' },
);

export type CategoryRef = z.infer<typeof categoryRefSchema>;

/** Optional free-text Detail; blank becomes null. */
export const detailSchema = z
  .string()
  .trim()
  .max(200, 'El detalle no puede superar los 200 caracteres.')
  .transform((value) => (value === '' ? null : value))
  .nullable();
