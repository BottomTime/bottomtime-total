import { CreateOrUpdateTankParamsDTO, TankMaterial } from '@bottomtime/api';

import { Page } from '@playwright/test';

export class TankProfilesFixture {
  constructor(private readonly page: Page) {}

  async gotoAdminTanks(): Promise<void> {
    await this.page.goto('/admin/tanks');
    await this.page.waitForURL('**/admin/tanks');
  }

  async gotoUserTanks(username: string): Promise<void> {
    await this.page.goto(`/profile/${username}/tanks`);
    await this.page.waitForURL(`**/profile/${username}/tanks`);
  }

  async updateTankProfile(options: CreateOrUpdateTankParamsDTO): Promise<void> {
    await this.page.getByTestId('name').fill(options.name);
    switch (options.material) {
      case TankMaterial.Aluminum:
        await this.page.getByTestId('material-al').click();
        break;

      case TankMaterial.Steel:
        await this.page.getByTestId('material-fe').click();
        break;
    }
    await this.page.getByTestId('volume').fill(options.volume.toString());
    await this.page
      .getByTestId('pressure')
      .fill(options.workingPressure.toString());
    await this.page.getByTestId('save-tank').click();
  }
}
