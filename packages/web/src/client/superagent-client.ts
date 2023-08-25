import { SuperAgentStatic } from 'superagent';
import { ApiClient } from './interfaces';
import { DefaultUserManager, UserManager } from './users';
import { DefaultDiveSiteManager, DiveSiteManager } from './diveSites';

export class SuperAgentClient implements ApiClient {
  private readonly diveSiteManager: DiveSiteManager;
  private readonly userManager: UserManager;

  constructor(agent: SuperAgentStatic) {
    this.diveSiteManager = new DefaultDiveSiteManager(agent);
    this.userManager = new DefaultUserManager(agent);
  }

  get diveSites(): DiveSiteManager {
    return this.diveSiteManager;
  }

  get users(): UserManager {
    return this.userManager;
  }
}
