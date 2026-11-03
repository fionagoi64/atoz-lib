import { z } from 'zod';
import { isbnSchema } from './isbn.schema.ts';

export const updateBookSchema = z
  .object({
    title: z.string().trim().min(1, 'Book title is required').optional(),
    author: z.string().trim().nullable().optional(),
    isbn: isbnSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: 'At least one field must be provided',
  });

export type UpdateBookDto = z.infer<typeof updateBookSchema>;
