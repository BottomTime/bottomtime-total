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
