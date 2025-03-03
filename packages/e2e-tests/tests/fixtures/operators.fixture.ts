import { CreateOrUpdateOperatorDTO } from '@bottomtime/api';

import { Page } from '@playwright/test';

export class OperatorsFixture {
  constructor(private readonly page: Page) {}

  async gotoOperators(): Promise<void> {
    await this.page.goto('/shops');
  }

  async gotoNewOperator(): Promise<void> {
    await this.page.goto('/shops/createNew');
  }

  async gotoOperator(key: string): Promise<void> {
    await this.page.goto(`/shops/${key}`);
  }

  async updateOperator(data: CreateOrUpdateOperatorDTO): Promise<void> {
    await this.page.getByTestId('name').fill(data.name);
    await this.page.getByTestId('slug').fill(data.slug);
    await this.page.getByTestId('description').fill(data.description);
    await this.page.getByTestId('active').setChecked(data.active);
    await this.page.getByTestId('operator-address').fill(data.address);
    if (data.gps) {
      await this.page.getByTestId('location-picker-set').click();
      await this.page
        .getByTestId('location-picker-lat')
        .fill(data.gps.lat.toString());
      await this.page
        .getByTestId('location-picker-lon')
        .fill(data.gps.lon.toString());
      await this.page.getByTestId('location-picker-save').click();
    } else {
      const gps = await this.page
        .getByTestId('location-picker-gps')
        .innerText();
      if (gps !== 'Unspecified') {
        await this.page.getByTestId('location-picker-clear').click();
      }
    }
    await this.page.getByTestId('email').fill(data.email || '');
    await this.page.getByTestId('phone').fill(data.phone || '');
    await this.page.getByTestId('website').fill(data.website || '');

    if (data.socials) {
      await this.page.getByTestId('facebook').fill(data.socials.facebook || '');
      await this.page
        .getByTestId('instagram')
        .fill(data.socials.instagram || '');
      await this.page.getByTestId('tiktok').fill(data.socials.tiktok || '');
      await this.page.getByTestId('twitter').fill(data.socials.twitter || '');
      await this.page.getByTestId('youtube').fill(data.socials.youtube || '');
    } else {
      await this.page.getByTestId('facebook').clear();
      await this.page.getByTestId('instagram').clear();
      await this.page.getByTestId('tiktok').clear();
      await this.page.getByTestId('twitter').clear();
      await this.page.getByTestId('youtube').clear();
    }

    await this.page.getByTestId('btn-save-operator').click();
  }
}
