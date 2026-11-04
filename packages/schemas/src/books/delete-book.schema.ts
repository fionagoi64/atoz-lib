import { z } from 'zod';

export const deleteBookSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type DeleteBookDto = z.infer<typeof deleteBookSchema>;
