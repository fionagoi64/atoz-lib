import { ApiBody, type SchemaObject } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

export function ApiZodBody(schema: ZodType) {
  return ApiBody({
    schema: z.toJSONSchema(schema, {
      target: 'openapi-3.0',
      io: 'input',
    }) as SchemaObject,
  });
}
