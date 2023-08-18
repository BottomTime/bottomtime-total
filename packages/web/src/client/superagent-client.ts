import { SuperAgentStatic } from 'superagent';
import { ApiClient } from './interfaces';
import { DefaultUserManager, UserManager } from './users';

export class SuperAgentClient implements ApiClient {
  private readonly userManager: UserManager;

  constructor(agent: SuperAgentStatic) {
    this.userManager = new DefaultUserManager(agent);
  }

  get users(): UserManager {
    return this.userManager;
  }
}
