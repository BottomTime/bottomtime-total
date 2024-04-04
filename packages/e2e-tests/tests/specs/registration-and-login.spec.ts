import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  UserDTO,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { expect, test } from '../fixtures';

const TestPassword = 'Sn@ke_Eyes_77';
const TestUser: UserDTO = {
  id: 'cec01cb6-9832-4854-adc1-72493563afea',
  email: 'randy-bobandy@microsoft.com',
  emailVerified: true,
  hasPassword: true,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'randy_randerson',
  profile: {
    userId: 'cec01cb6-9832-4854-adc1-72493563afea',
    username: 'randy_randerson',
    memberSince: new Date(),
    name: 'Randy Randerson',
    location: 'Sunnyvale, CA',
  },
  settings: {
    depthUnit: DepthUnit.Meters,
    pressureUnit: PressureUnit.Bar,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
  },
} as const;

test.describe('Registration', () => {
  test('will allow a user to register using the registration page', async ({
    api,
    page,
  }) => {
    await page.goto('/register');
    await page.getByLabel('Username:*').fill(TestUser.username);
    await page.getByLabel('Email address:*').fill(TestUser.email!);
    await page.getByLabel('Password:*', { exact: true }).fill(TestPassword);
    await page.getByLabel('Confirm password:*').fill(TestPassword);
    await page.getByLabel('Display name:').fill(TestUser.profile!.name!);
    await page.getByLabel('Location:').fill(TestUser.profile!.location!);
    await page.getByTestId('register-submit').click();
    await page.waitForURL('**/welcome');

    const user = await api.users.getUser(TestUser.username);
    expect(user.username).toBe(TestUser.username);
    expect(user.email).toBe(TestUser.email);
    expect(user.profile?.name).toBe(TestUser.profile!.name);
    expect(user.profile?.location).toBe(TestUser.profile!.location);
  });

  test('will show validation errors if the username or email address are taken', async ({
    api,
    page,
  }) => {
    await api.users.createUser({
      username: 'randy_randerson',
      email: 'randy-bobandy@microsoft.com',
    });

    await page.goto('/register');
    await page.getByLabel('Username:*').fill('randy_randerson');
    await page
      .getByLabel('Email address:*')
      .fill('randy-bobandy@microsoft.com');
    await page.getByLabel('Password:*', { exact: true }).fill('Sn@ke_Eyes_77');
    await page
      .getByLabel('Confirm password:*', { exact: true })
      .fill('Sn@ke_Eyes_77');
    await page.getByLabel('Display name:').fill('Randy Randerson');
    await page.getByLabel('Location:').fill('Sunnyvale, CA');
    await page.getByLabel('Display name:').fill('Randy Randerson');
    await page.getByTestId('register-submit').click();

    await expect(page.getByTestId('username-error')).toContainText(
      'Username is already taken',
    );
    await expect(page.getByTestId('email-error')).toContainText(
      'Email address is already in use',
    );
  });

  test('will allow a user to log into their account', async ({ api, page }) => {
    await api.users.createUser({
      username: TestUser.username,
      email: TestUser.email,
      password: TestPassword,
      profile: {
        name: TestUser.profile!.name,
        location: TestUser.profile!.location,
      },
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByTestId('login-username').fill(TestUser.username);
    await page.getByTestId('login-password').fill(TestPassword);
    await page.getByTestId('login-submit').click();

    // Look for the navbar to be updated to show the user's display name.
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
    await expect(page.getByTestId('user-menu-button')).toContainText(
      TestUser.profile!.name!,
    );
  });

  test('will show an error if a user attempts an invalid login', async ({
    api,
    page,
  }) => {
    await api.users.createUser({
      username: TestUser.username,
      email: TestUser.email,
      password: TestPassword,
      profile: {
        name: TestUser.profile!.name,
        location: TestUser.profile!.location,
      },
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByTestId('login-username').fill(TestUser.username);
    await page.getByTestId('login-password').fill('wrong');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('toast-login-attempt-failed')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeFocused();
    await expect(page.getByTestId('login-password')).toBeEmpty();
  });
});
