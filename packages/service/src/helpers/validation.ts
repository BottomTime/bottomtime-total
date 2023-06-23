import { Schema } from 'joi';

import { ValidationError, ValidationResult } from '../errors';

export function isValid(data: any, schema: Schema): ValidationResult {
  const result = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (result.error) {
    return {
      isValid: false,
      errors: result.error.details.map((details) => ({
        message: details.message,
        path: details.path.map((element) => element.toString()).join('.'),
      })),
    };
  }

  return {
    isValid: true,
    parsed: result.value,
  };
}

export function assertValid(
  data: any,
  schema: Schema,
  message?: string,
): ValidationResult {
  const result = isValid(data, schema);
  if (!result.isValid) {
    throw new ValidationError(message ?? 'Validation failed', result.errors);
  }

  return result;
}
