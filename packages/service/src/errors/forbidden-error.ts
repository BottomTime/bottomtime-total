export class ForbiddenError extends Error {
  constructor(message?: string) {
    super(
      message ??
        'Your request could not be completed. You are not authorized to perform the desired action.',
    );
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
