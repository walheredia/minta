import { z } from 'zod';
import {
  CATEGORY_NAME_MAX_LENGTH,
  toCategoryDisplayName,
} from './category-name.js';

/** Reference to the Expense Category an Expense is classified under. */
export const categoryRefSchema = z.discriminatedUnion(
  'source',
  [
    z.object({ source: z.literal('SYSTEM'), id: z.string().min(1) }),
    z.object({ source: z.literal('HOUSEHOLD'), id: z.string().min(1) }),
    z.object({
      source: z.literal('NEW'),
      name: z
        .string()
        .transform(toCategoryDisplayName)
        .pipe(
          z
            .string()
            .min(1, 'Escribí un nombre para el tipo de gasto.')
            .max(
              CATEGORY_NAME_MAX_LENGTH,
              `El tipo de gasto puede tener hasta ${CATEGORY_NAME_MAX_LENGTH} caracteres.`,
            ),
        ),
    }),
  ],
  { error: 'Elegí o creá un tipo de gasto.' },
);

export type CategoryRef = z.infer<typeof categoryRefSchema>;
