import { z } from 'zod';

export const bookSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  author: z.string().nullable(),
  isbn: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type BookDto = z.infer<typeof bookSchema>;
