export class ConflictError extends Error {
  constructor(message?: string, readonly conflictingField?: string) {
    super(message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
