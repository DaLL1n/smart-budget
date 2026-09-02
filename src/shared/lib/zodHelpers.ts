import { z, ZodSchema } from 'zod';

/**
 * Validate and safely parse data against a Zod schema
 */
export function parseWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Zod Validation Error:', result.error.format());
    throw new Error(`Invalid data contract: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
  return result.data;
}

/**
 * Validate without throwing, returning a tuple [data | null, error | null]
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  return schema.safeParse(data);
}
