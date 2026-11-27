import { z } from 'zod';

/** Maximum length of an Expense's Detail; mirrors `Expense.detail VarChar(200)`. */
export const DETAIL_MAX_LENGTH = 200;

/** Optional free-text Detail; blank becomes null. */
export const detailSchema = z
  .string()
  .trim()
  .max(
    DETAIL_MAX_LENGTH,
    `El detalle no puede superar los ${DETAIL_MAX_LENGTH} caracteres.`,
  )
  .transform((value) => (value === '' ? null : value))
  .nullable();
