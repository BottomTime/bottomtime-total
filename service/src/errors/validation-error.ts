export type ValidationErrors = Array<{
  message: string;
  path: string;
}>;

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors?: ValidationErrors;
}

export class ValidationError extends Error {
  constructor(message?: string, readonly errors?: ValidationErrors) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
