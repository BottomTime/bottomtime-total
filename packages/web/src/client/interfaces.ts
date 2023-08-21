import { DiveSiteManager } from './diveSites';
import { UserManager } from './users';

export interface ApiClient {
  readonly diveSites: DiveSiteManager;
  readonly users: UserManager;
}
