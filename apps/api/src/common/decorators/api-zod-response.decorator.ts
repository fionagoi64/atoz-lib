import { ApiResponse, type SchemaObject } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

export function ApiZodResponse(
  status: number,
  schema: ZodType,
  description?: string,
) {
  return ApiResponse({
    status,
    description,
    schema: z.toJSONSchema(schema, {
      target: 'openapi-3.0',
      io: 'output',
    }) as SchemaObject,
  });
}
