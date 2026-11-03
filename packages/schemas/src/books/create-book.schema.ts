import { z } from 'zod';
import { isbnSchema } from './isbn.schema.ts';

export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'Book title is required'),
  author: z.string().trim().optional(),
  isbn: isbnSchema.optional(),
});

export type CreateBookDto = z.infer<typeof createBookSchema>;
