import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'Book title is required'),
  author: z.string().trim().optional(),
  isbn: z.string().trim().optional(),
});

export type CreateBookDto = z.infer<typeof createBookSchema>;
