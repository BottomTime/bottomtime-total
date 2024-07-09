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
    await this.page.goto('/');
    await this.page.getByTestId('login-button').click();
    await this.page.getByTestId('login-username').fill(username);
    await this.page.getByTestId('login-password').fill(password);
    await this.page.getByTestId('login-submit').click();
    await this.page.waitForSelector('[data-testid="user-menu-button"]', {
      timeout: 8000,
    });
  }

  async logout(): Promise<void> {
    await this.page.getByTestId('user-menu-button').click();
    await this.page.getByRole('link', { name: 'Logout' }).click();
    await this.page.waitForURL('**/');
  }
}
