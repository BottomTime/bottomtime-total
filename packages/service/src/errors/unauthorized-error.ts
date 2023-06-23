export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(
      message ??
        'You must be logged in to view the resource you are looking for.',
    );
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
