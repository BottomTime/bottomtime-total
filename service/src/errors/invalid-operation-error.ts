export class InvalidOperationError extends Error {
  constructor(message?: string, readonly details?: unknown) {
    super(
      message ??
        'The requested operation is not permitted on the specified resource.',
    );
    Object.setPrototypeOf(this, InvalidOperationError.prototype);
  }
}
