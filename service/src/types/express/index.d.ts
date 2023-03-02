import { type BTContext } from '../../bt-context';
import { UserData } from '../../users';

declare global {
  namespace Express {
    export interface Request extends BTContext {}
    export interface User extends UserData {}
  }
}

export {};
