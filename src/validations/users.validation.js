import { z } from 'zod';

// Validate a user id coming from route params
export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Validate payloads for updating a user
export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).trim().optional(),
  email: z.string().email().max(255).toLowerCase().trim().optional(),
  role: z.enum(['user', 'admin']).optional(),
});
