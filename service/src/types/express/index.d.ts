import Logger from 'bunyan';
import { User as BTUser, UserManager } from '../../users';

declare global {
  namespace Express {
    export interface Request {
      /** A Bunyan logger for writing to the event log. */
      log: Logger;

      /** A unique ID for the current request. */
      requestId: string;

      /** For user routes, this will be set to the user account specified in the path. */
      selectedUser?: User;

      /** A UserManager that can be used to access and manage user accounts. */
      userManager: UserManager;

      /** A reference to the currently logged in user. (Or undefined if the call is unauthenticated.) */
      user?: User;
    }

    export interface User extends BTUser {}
  }
}

export {};
