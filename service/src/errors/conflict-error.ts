export class ConflictError extends Error {
  constructor(message?: string, readonly conflictingField?: string) {
    super(
      message ?? 'Your request could not be completed due to a data conflict.',
    );
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
