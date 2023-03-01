import { type BTContext } from '../../bt-context';

declare global {
  namespace Express {
    export interface Request extends BTContext {}
  }
}

export {};
