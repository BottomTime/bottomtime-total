import { ApiClient, UserRole } from '@bottomtime/api';

import { Page } from '@playwright/test';

export class AuthFixture {
  constructor(private readonly api: ApiClient, private readonly page: Page) {}

  readonly DefaultAdminUsername = 'admin_user';
  readonly DefaultAdminPassword = 'Admin_1234@@';

  async createAdminAndLogin(
    username?: string,
    password?: string,
  ): Promise<void> {
    username = username || this.DefaultAdminUsername;
    password = password || this.DefaultAdminPassword;

    await this.api.users.createUser({
      username,
      password,
      role: UserRole.Admin,
      email: `${username}@testing.org`,
    });
    await this.login(username, password);
  }

  async createUserAndLogin(username: string, password: string): Promise<void> {
    await this.api.users.createUser({
      username,
      password,
      email: `${username}@testing.org`,
    });
    await this.login(username, password);
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.request.post('/api/auth/login', {
      data: {
        usernameOrEmail: username,
        password,
      },
      failOnStatusCode: true,
    });
  }

  async logout(): Promise<void> {
    await this.page.request.post('/api/auth/logout', {
      failOnStatusCode: true,
    });
  }
}
