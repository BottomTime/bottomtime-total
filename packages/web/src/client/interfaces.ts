import { UserManager } from './users';

export interface ApiClient {
  readonly users: UserManager;
}
