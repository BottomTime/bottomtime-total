import { Page } from '@playwright/test';

export class FeatureFlagsFixture {
  constructor(private readonly page: Page) {}

  async gotoFeatureFlags(): Promise<void> {
    await this.page.goto('/admin/features');
  }

  async toggleFeatureFlag(key: string): Promise<void> {
    const text = await this.page
      .getByTestId(`feature-flag-${key}`)
      .locator('label')
      .textContent();
    await this.page.getByTestId(`feature-flag-${key}`).locator('label').click();
    await this.page.waitForSelector(
      `[data-testid="toast-feature-${
        text === 'Off' ? 'enabled' : 'disabled'
      }"]`,
    );
  }
}
