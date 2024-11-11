import { CreateOrUpdateTankParamsDTO, TankMaterial } from '@bottomtime/api';

import { expect, test } from '../fixtures';

const Username = 'tammy24';
const Password = 'Passw0rd1234@@';

const TankData: CreateOrUpdateTankParamsDTO = {
  name: 'Test Tank',
  material: TankMaterial.Aluminum,
  volume: 12.3,
  workingPressure: 232,
};

test.describe('User Tank Profile Management', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.createUserAndLogin(Username, Password);
  });

  test('will allow a user to create a new custom tank profile', async ({
    api,
    page,
    tankProfiles,
  }) => {
    await tankProfiles.gotoUserTanks(Username);
    await page.getByTestId('tanks-list-add').click();
    await tankProfiles.updateTankProfile(TankData);
    await page.waitForSelector('[data-testid="toast-tank-created"]');

    const result = await api.tanks.listTanks({
      username: Username,
      includeSystem: false,
    });
    const tank = result.data.find((t) => t.name === TankData.name);

    expect(tank).toBeDefined();
    expect(tank?.name).toBe(TankData.name);
    expect(tank?.material).toBe(TankData.material);
    expect(tank?.volume).toBe(TankData.volume);
    expect(tank?.workingPressure).toBe(TankData.workingPressure);

    await expect(page.getByTestId(`select-tank-${tank?.id}`)).toContainText(
      TankData.name,
    );
  });

  test('will allow a user to edit an existing profile', async ({
    api,
    page,
    tankProfiles,
  }) => {
    const newData: CreateOrUpdateTankParamsDTO = {
      name: 'Altered Tank',
      material: TankMaterial.Steel,
      volume: 13.8,
      workingPressure: 207,
    };
    const tank = await api.tanks.createTank(TankData, Username);

    await tankProfiles.gotoUserTanks(Username);
    await page.getByTestId(`select-tank-${tank.id}`).click();
    await tankProfiles.updateTankProfile(newData);
    await page.waitForSelector('[data-testid="toast-tank-saved"]');

    const result = await api.tanks.getTank(tank.id, Username);
    expect(result.toJSON()).toEqual({
      ...tank.toJSON(),
      ...newData,
    });

    await expect(page.getByTestId(`tank-${tank.id}`)).toContainText(
      newData.name,
    );
  });

  test("will allow a user to navigate to a tanks' page to edit it", async ({
    api,
    page,
    tankProfiles,
  }) => {
    const newData: CreateOrUpdateTankParamsDTO = {
      name: 'Altered Tank',
      material: TankMaterial.Steel,
      volume: 13.8,
      workingPressure: 207,
    };
    const tank = await api.tanks.createTank(TankData, Username);

    await tankProfiles.gotoUserTanks(Username);
    await page.getByTestId(`select-tank-${tank.id}`).click();
    await page.getByTestId('drawer-fullscreen').getByRole('button').click();
    await page.waitForURL(`**/profile/${Username}/tanks/${tank.id}`);
    await tankProfiles.updateTankProfile(newData);
    await page.waitForSelector('[data-testid="toast-tank-saved"]', {
      timeout: 400,
    });

    const result = await api.tanks.getTank(tank.id, Username);
    expect(result.toJSON()).toEqual({
      ...tank.toJSON(),
      ...newData,
    });
  });

  test('will allow user to navigate to the new tank page and create a new tank profile', async ({
    api,
    page,
    tankProfiles,
  }) => {
    await tankProfiles.gotoNewTank(Username);
    await tankProfiles.updateTankProfile(TankData);
    await page.waitForURL(new RegExp(`.*/profile/${Username}/tanks/(?!new).*`));

    await expect(page.getByTestId('name')).toHaveValue(TankData.name);
    await expect(page.getByTestId('material-al')).toBeChecked();
    await expect(page.getByTestId('volume')).toHaveValue(
      TankData.volume.toString(),
    );
    await expect(page.getByTestId('pressure')).toHaveValue(
      TankData.workingPressure.toString(),
    );

    const result = await api.tanks.listTanks({
      username: Username,
      includeSystem: false,
    });
    const tank = result.data.find((t) => t.name === TankData.name);

    expect(tank).toBeDefined();
    expect(tank?.name).toBe(TankData.name);
    expect(tank?.material).toBe(TankData.material);
    expect(tank?.volume).toBe(TankData.volume);
    expect(tank?.workingPressure).toBe(TankData.workingPressure);
  });

  test('will allow a user to delete a tank profile', async ({
    api,
    page,
    tankProfiles,
  }) => {
    const tank = await api.tanks.createTank(TankData, Username);
    await tankProfiles.gotoUserTanks(Username);
    await page.getByTestId(`delete-tank-${tank.id}`).click();
    await page.getByTestId('dialog-confirm-button').click();
    await page.waitForSelector('[data-testid="toast-tank-deleted"]');
    await expect(page.getByTestId(`tank-${tank.id}`)).not.toBeVisible();
    await expect(api.tanks.getTank(tank.id, Username)).rejects.toThrowError();
  });
});
