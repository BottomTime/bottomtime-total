import { ErrorResponseDTO } from '../types';

export class HttpException extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly message: string,
    public readonly body: ErrorResponseDTO,
  ) {
    super(message);
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}
