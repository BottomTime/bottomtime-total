import { Page } from '@playwright/test';

export class AuthFixture {
  constructor(private readonly page: Page) {}

  async login(username: string, password: string): Promise<void> {
    await this.page.goto('/');
    await this.page.getByTestId('login-button').click();
    await this.page.getByTestId('login-username').fill(username);
    await this.page.getByTestId('login-password').fill(password);
    await this.page.getByTestId('login-submit').click();
    await this.page.waitForSelector('[data-testid="user-menu-button"]');
  }

  async logout(): Promise<void> {
    await this.page.getByTestId('user-menu-button').click();
    await this.page.getByRole('link', { name: 'Logout' }).click();
    await this.page.waitForURL('**/');
  }
}
