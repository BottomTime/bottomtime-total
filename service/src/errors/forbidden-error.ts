import { type Request } from 'express';
import { type User } from '../users';

export class ForbiddenError extends Error {
  readonly path: string | undefined;
  readonly method: string | undefined;
  readonly user: User | undefined;

  constructor(message?: string, req?: Request) {
    super(message);
    this.path = req?.originalUrl;
    this.method = req?.method;
    // this.user = req?.user;
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
