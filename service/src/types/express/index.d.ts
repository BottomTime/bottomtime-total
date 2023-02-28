import { type BTContext } from '../../bt-context';

declare global {
  namespace Express {
    export type Request = BTContext;
  }
}

export {};
