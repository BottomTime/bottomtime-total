import {
  AccountTier,
  CreateOrUpdateOperatorDTO,
  HttpException,
  UserDTO,
} from '@bottomtime/api';

import { expect, test } from '../fixtures';

const Username = 'Johnny_Diver';
const Password = 'P@ssw0rd__';
const OperatorData: CreateOrUpdateOperatorDTO = {
  name: 'Awesome Shop',
  slug: 'awesome-shop',
  description: 'This shop is amazing!!',
  active: true,
  gps: {
    lat: 25.745055,
    lon: -80.15388,
  },
  address: '4000 Crandon Blvd, Key Biscayne, FL 33149, United States',
  phone: '1 555 555 5555',
  email: 'email@dive.shop',
  website: 'https://awesome.shop/',
  socials: {
    facebook: 'facebook',
    instagram: 'instagram',
    tiktok: 'tiktok',
    twitter: 'twitter',
    youtube: 'youtube',
  },
};

test.describe('Operators', () => {
  let user: UserDTO;

  test.describe('as a shop owner', () => {
    test.beforeEach(async ({ api, auth }) => {
      user = await api.userAccounts.createUser({
        username: Username,
        password: Password,
      });
      user = await api.userAccounts.changeMembership(
        user,
        AccountTier.ShopOwner,
      );
      await auth.login(Username, Password);
    });

    test('will allow a user to create a new dive operator', async ({
      api,
      operators,
      page,
    }) => {
      await operators.gotoOperators();
      await page.getByTestId('operators-create-shop').click();
      await operators.updateOperator(OperatorData);

      await expect(
        page.getByTestId(`select-${OperatorData.slug}`),
      ).toBeVisible();

      const operator = await api.operators.getOperator(OperatorData.slug);
      expect(operator.name).toBe(OperatorData.name);
      expect(operator.description).toBe(OperatorData.description);
      expect(operator.active).toBe(OperatorData.active);
      expect(operator.gps).toEqual(OperatorData.gps);
      expect(operator.address).toBe(OperatorData.address);
      expect(operator.phone).toBe(OperatorData.phone);
      expect(operator.email).toBe(OperatorData.email);
      expect(operator.website).toBe(OperatorData.website);
      expect(operator.socials).toEqual(OperatorData.socials);
    });

    test('will allow users to search for and update a dive operator', async ({
      api,
      operators,
      page,
    }) => {
      const updated: CreateOrUpdateOperatorDTO = {
        ...OperatorData,
        name: 'Even Moar Awesome Shop',
        slug: 'even-moar-awesome-shop',
        description: 'A different description',
        socials: {
          facebook: 'facebook2',
          instagram: 'instagram2',
          tiktok: 'tiktok2',
          twitter: 'twitter2',
          youtube: 'youtube2',
        },
      };

      await operators.gotoNewOperator();
      await operators.updateOperator(OperatorData);
      await page.waitForURL(`**/shops/${OperatorData.slug}`);

      await operators.gotoOperators();

      await page.getByTestId('operator-search').fill('awesome');
      await page.getByTestId('operator-location-select-btn').click();
      await page.getByTestId('latitude').fill('25');
      await page.getByTestId('longitude').fill('-80');
      await page.getByTestId('confirm-location').click();
      await page.getByTestId('operator-location-radius').fill('500');
      await page.getByText('Show only my shops').click();
      await page.getByTestId('btn-operator-search').click();

      await page.getByTestId(`select-${OperatorData.slug}`).click();
      await page.getByTestId('drawer-fullscreen').getByRole('button').click();
      await page.waitForURL(`**/shops/${OperatorData.slug}`);

      await operators.updateOperator(updated);
      await page.getByTestId('dialog-confirm-button').click();
      await page.waitForSelector('[data-testid="toast-dive-operator-saved"]');

      const operator = await api.operators.getOperator(updated.slug);
      expect(operator.name).toBe(updated.name);
      expect(operator.name).toBe(updated.name);
      expect(operator.description).toBe(updated.description);
      expect(operator.active).toBe(updated.active);
      expect(operator.gps).toEqual(updated.gps);
      expect(operator.address).toBe(updated.address);
      expect(operator.phone).toBe(updated.phone);
      expect(operator.email).toBe(updated.email);
      expect(operator.website).toBe(updated.website);
      expect(operator.socials).toEqual(updated.socials);
    });

    test('will allow a shop owner to delete one of their shops', async ({
      api,
      operators,
      page,
    }) => {
      await operators.gotoNewOperator();
      await operators.updateOperator(OperatorData);
      await page.waitForURL(`**/shops/${OperatorData.slug}`);

      await operators.gotoOperators();
      await page.getByTestId('operator-search').fill('awesome');
      await page.getByTestId('btn-operator-search').click();

      await page.getByTestId(`delete-${OperatorData.slug}`).click();
      await page.getByTestId('dialog-confirm-button').click();
      await page.waitForSelector('[data-testid="toast-operator-deleted"]');

      await expect(
        api.operators.getOperator(OperatorData.slug),
      ).rejects.toThrowError(HttpException);
    });
  });
});
