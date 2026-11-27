import { z } from 'zod';

export const searchCategoriesSchema = z.object({
  q: z.string().default(''),
});

export type SearchCategoriesQuery = z.infer<typeof searchCategoriesSchema>;
