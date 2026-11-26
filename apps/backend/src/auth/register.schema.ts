import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
