/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodType } from 'zod';

export type ValidationErrors = Array<{
  message: string;
  path: string;
}>;

export interface ValidationResult<T = any> {
  readonly isValid: boolean;
  readonly errors?: ValidationErrors;
  readonly parsed?: T;
}

export class ValidationError extends Error {
  constructor(message?: string, readonly errors?: ValidationErrors) {
    super(
      message ??
        'Your request could not be completed because there were some validation errors.',
    );
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export function isValid<T>(data: any, schema: ZodType<T>): ValidationResult<T> {
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
  schema: ZodType<T>,
  message?: string,
): T {
  const result = isValid(data, schema);
  if (!result.isValid || !result.parsed) {
    throw new ValidationError(message ?? 'Validation failed', result.errors);
  }

  return result.parsed;
}
