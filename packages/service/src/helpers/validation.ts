import { ZodTypeAny } from 'zod';

import { ValidationError, ValidationResult } from '../errors';

export function isValid<T>(data: any, schema: ZodTypeAny): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      isValid: true,
      parsed: result.data,
    };
  }

  return {
    isValid: false,
    errors: result.error.errors.map((error) => ({
      message: error.message,
      path: error.path.map((element) => element.toString()).join('.'),
    })),
  };
}

export function assertValid<T>(
  data: any,
  schema: ZodTypeAny,
  message?: string,
): T {
  const result = isValid<T>(data, schema);
  if (!result.isValid || !result.parsed) {
    throw new ValidationError(message ?? 'Validation failed', result.errors);
  }

  return result.parsed;
}
