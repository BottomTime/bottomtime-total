export class MissingResourceError extends Error {
  constructor(message?: string) {
    super(
      message ??
        'The resource you were looking for could not be found. Please check your path and try again.',
    );
    Object.setPrototypeOf(this, MissingResourceError.prototype);
  }
}
