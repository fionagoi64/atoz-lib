import { ApiResponse, type SchemaObject } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

export function ApiZodResponse(
  status: number,
  schema: ZodType,
  description?: string,
  example?: unknown,
) {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'output',
  });

  return ApiResponse({
    status,
    description,
    schema: {
      ...jsonSchema,
      ...(example !== undefined ? { example } : {}),
    } as SchemaObject,
  });
}
