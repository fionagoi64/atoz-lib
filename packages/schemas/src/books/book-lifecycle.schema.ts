import { z } from 'zod';
import { bookStatusSchema } from './book.schema.ts';

export const bookLifecycleActionSchema = z.enum([
  'CREATED',
  'ARCHIVED',
  'UNARCHIVED',
  'DELETED',
  'RESTORED',
]);

export const bookLifecycleLogSchema = z.object({
  id: z.uuid(),
  bookId: z.uuid(),
  action: bookLifecycleActionSchema,
  previousStatus: bookStatusSchema.nullable(),
  newStatus: bookStatusSchema,
  reason: z.string().nullable(),
  adminId: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const bookLifecycleReasonSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});

export type BookLifecycleAction = z.infer<typeof bookLifecycleActionSchema>;

export type BookLifecycleLogDto = z.infer<typeof bookLifecycleLogSchema>;

export type BookLifecycleReasonDto = z.infer<typeof bookLifecycleReasonSchema>;
