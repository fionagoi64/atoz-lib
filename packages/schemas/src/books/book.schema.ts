import { z } from 'zod';

export const bookStatusSchema = z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']);

export const bookSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  author: z.string().nullable(),
  isbn: z.string().nullable(),

  status: bookStatusSchema,
  deletedAt: z.iso.datetime().nullable(),
  statusBeforeDelete: z.enum(['ACTIVE', 'ARCHIVED']).nullable(),

  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type BookStatus = z.infer<typeof bookStatusSchema>;
export type BookDto = z.infer<typeof bookSchema>;
