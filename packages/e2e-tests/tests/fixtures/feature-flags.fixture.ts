import { Page } from '@playwright/test';

export class FeatureFlagsFixture {
  constructor(private readonly page: Page) {}

  async gotoFeatureFlags(): Promise<void> {
    await this.page.goto('/admin/features');
  }

  async toggleFeatureFlag(key: string): Promise<void> {
    await this.page
      .getByTestId(`feature-flag-${key}`)
      .locator('label div')
      .click();
    await this.page.waitForResponse(`/api/features/${key}/toggle`);
  }
}
