import { SearchDiveSitesParamsDTO } from '@bottomtime/api';

import { Page } from '@playwright/test';

export class DiveSitesFixture {
  constructor(private readonly page: Page) {}

  async gotoDiveSites(): Promise<void> {
    await this.page.goto('/diveSites');
  }

  async gotoDiveSite(id: string): Promise<void> {
    await this.page.goto(`/diveSites/${id}`);
  }

  async gotoNewDiveSite(): Promise<void> {
    await this.page.goto('/diveSites/new');
  }

  async searchForDiveSite(
    options: Omit<
      SearchDiveSitesParamsDTO,
      'skip' | 'limit' | 'sortBy' | 'sortOrder'
    >,
  ): Promise<void> {
    if (options.query) {
      await this.page.getByTestId('search-dive-sites').fill(options.query);
    }

    if (options.location) {
      await this.page.getByTestId('select-location').click();
      await this.page
        .getByTestId('latitude')
        .fill(options.location.lat.toString());
      await this.page
        .getByTestId('longitude')
        .fill(options.location.lon.toString());
      await this.page.getByTestId('confirm-location').click();

      if (options.radius) {
        await this.page
          .getByTestId('search-range')
          .fill(options.radius.toString());
      }
    }

    if (options.rating) {
      await this.page.getByTestId('rating').fill(options.rating.min.toString());
    }

    if (options.difficulty) {
      await this.page
        .getByTestId('difficulty')
        .fill(options.difficulty.max.toString());
    }

    if (typeof options.shoreAccess === 'boolean') {
      if (options.shoreAccess) {
        await this.page.getByText('Accessible from shore').click();
      } else {
        await this.page.getByText('Accessible by boat').click();
      }
    } else {
      await this.page.getByText('Any').first().click();
    }

    if (typeof options.freeToDive === 'boolean') {
      if (options.freeToDive) {
        await this.page.getByText('Free to dive', { exact: true }).click();
      } else {
        await this.page.getByText('Fee required').click();
      }
    } else {
      await this.page.getByText('Any').nth(1).click();
    }

    await this.page.getByTestId('refresh-dive-sites').click();
  }
}
