import { UserRole } from '@bottomtime/api';

import { UserEntity } from '@/data';
import { test } from '@fixture';
import { expect } from '@playwright/test';

const TestPassword = 'Sn@ke_Eyes_77';
const TestUser: Partial<UserEntity> = {
  id: 'cec01cb6-9832-4854-adc1-72493563afea',
  email: 'randy-bobandy@microsoft.com',
  emailLowered: 'randy-bobandy@microsoft.com',
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date(),
  passwordHash: '$2b$04$w563pCU0MEL0X1Fvxpjyxez.ZRbty4gblpyfKffd0PsvJDVOb6VdS',
  role: UserRole.User,
  username: 'randy_randerson',
  usernameLowered: 'randy_randerson',
  name: 'Randy Randerson',
  location: 'Sunnyvale, CA',
};

test.describe('Registration', () => {
  test('will allow a user to register using the registration page', async ({
    db,
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

    const users = db.getRepository(UserEntity);
    const user = await users.findOneBy({ username: 'dave_a32' });
    expect(user).not.toBeNull();
  });

  test('will show validation errors if the username or email address are taken', async ({
    db,
    page,
  }) => {
    const users = db.getRepository(UserEntity);
    const user = new UserEntity();
    Object.assign(user, TestUser);
    await users.save(user);

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

  test('will allow a user to log into their account', async ({ db, page }) => {
    const users = db.getRepository(UserEntity);
    const user = new UserEntity();
    Object.assign(user, TestUser);
    await users.save(user);

    await page.goto('/');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByTestId('login-username').fill(user.username);
    await page.getByTestId('login-password').fill(TestPassword);
    await page.getByTestId('login-submit').click();

    // Look for the navbar to be updated to show the user's display name.
    await expect(page.getByTestId('user-menu-button')).toBeVisible();
    await expect(page.getByTestId('user-menu-button')).toContainText(
      user.name!,
    );
  });

  test('will show an error if a user attempts an invalid login', async ({
    db,
    page,
  }) => {
    const users = db.getRepository(UserEntity);
    const user = new UserEntity();
    Object.assign(user, TestUser);
    await users.save(user);

    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByTestId('login-username').fill(user.username);
    await page.getByTestId('login-password').fill('wrong');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('toast-login-attempt-failed')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeFocused();
    await expect(page.getByTestId('login-password')).toBeEmpty();
  });
});
