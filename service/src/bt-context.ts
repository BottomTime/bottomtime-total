import type bunyan from 'bunyan';
import { type UserManager } from './users';

export interface BTContext {
  log: bunyan;

  requestId: string;

  userManager: UserManager;
}
