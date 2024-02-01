import { expect, test } from '../fixture';

test.describe('Registration', () => {
  test.beforeAll(async ({ app }) => {
    await app.purgeDatabase();
  });

  test.afterEach(async ({ app }) => {
    await app.purgeDatabase();
  });

  test('will allow a user to register using the registration page', async ({
    page,
  }) => {
    await page.goto('/register');
    await page.getByLabel('Username:*').fill('dave_a32');
    await page.getByLabel('Email address:*').fill('daveyboydives@gmail.com');
    await page.getByLabel('Password:*', { exact: true }).fill('P@ssw3rd_77');
    await page.getByLabel('Confirm password:*').fill('P@ssw3rd_77');
    await page
      .getByRole('combobox', { name: 'Profile info visible to:*' })
      .selectOption('public');
    await page.getByLabel('Display name:').fill('Dave Anders');
    await page.getByLabel('Location:').fill('Vancouver, BC');
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/welcome');
  });
});
