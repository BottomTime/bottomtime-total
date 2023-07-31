import { DiveSite, DiveSiteManager } from '../../diveSites';
import Logger from 'bunyan';
import { MailClient } from '../../email';
import { Tank, TankManager } from '../../tanks';
import { User as BTUser, UserManager } from '../../users';

declare global {
  namespace Express {
    export interface Request {
      /** A Bunyan logger for writing to the event log. */
      log: Logger;

      /** A mail client for sendint emails to users. */
      mail: MailClient;

      /** A unique ID for the current request. */
      requestId: string;

      /** For dive site routes, this will be set to the dive site specified in the path. */
      selectedDiveSite?: DiveSite;

      /** For tank routes, this will be set to the pre-defined tank profile specified in the path. */
      selectedTank?: Tank;

      /** For user routes, this will be set to the user account specified in the path. */
      selectedUser?: User;

      /** A {@link DiveSiteManager} that can be used to search for and manage dive sites. */
      diveSiteManager: DiveSiteManager;

      /** A {@link TankManager} that can be used to access and manage pre-defined scuba tank profiles. */
      tankManager: TankManager;

      /** A {@link UserManager} that can be used to access and manage user accounts. */
      userManager: UserManager;

      /** A reference to the currently logged in user. (Or undefined if the call is unauthenticated.) */
      user?: User;
    }

    export interface User extends BTUser {}
  }
}

export {};
