import Logger from 'bunyan';
import { type UserManager } from './users';

export interface BTContext {
  /** A Bunyan logger for writing to the event log. */
  log: Logger;

  /** A unique ID for the current request. */
  requestId: string;

  /** A UserManager that can be used to access and manage user accounts. */
  userManager: UserManager;
}
