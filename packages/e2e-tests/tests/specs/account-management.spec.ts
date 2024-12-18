import {
  CreateUserParamsDTO,
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  ProfileDTO,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

import { resolve } from 'path';

import { expect, test } from '../fixtures';

const TestPassword = '(*Hkho8)*H)JJh989';
const TestUser: CreateUserParamsDTO = {
  username: 'bubbles',
  email: 'bubbles@thepark.org',
  password: TestPassword,
  settings: {
    depthUnit: DepthUnit.Meters,
    temperatureUnit: TemperatureUnit.Celsius,
    pressureUnit: PressureUnit.Bar,
    weightUnit: WeightUnit.Kilograms,
  },
};

const UserProfile: Partial<ProfileDTO> = {
  name: 'Bubbles McGee',
  location: 'Sunnyvale',
  bio: 'I live in Sunnyvale',
  experienceLevel: 'Beginner',
  startedDiving: '2023-03-09',
  logBookSharing: LogBookSharing.Public,
};

test.describe('Account and Profile Management', () => {
  test.beforeEach(async ({ api, auth }) => {
    await api.userAccounts.createUser(TestUser);
    await auth.login(TestUser.username, TestPassword);
  });

  test('will allow users to update their profile info', async ({
    api,
    page,
  }) => {
    await page.goto('/profile');
    await page.waitForURL('**/profile');

    await page.getByTestId('nameInput').fill(UserProfile.name!);
    await page.getByTestId('locationInput').fill(UserProfile.location!);
    await page.locator('#logbook-sharing').selectOption(LogBookSharing.Public);
    await page.getByTestId('bioInput').fill(UserProfile.bio!);
    await page.getByTestId('experienceLevelInput').selectOption('Beginner');
    await page.locator('#started-diving-year').selectOption('2023');
    await page.locator('#started-diving-month').selectOption('03');
    await page.locator('#started-diving-day').selectOption('09');
    await page.getByTestId('save-profile').click();

    await expect(page.getByTestId('toast-profile-saved')).toBeVisible();
    await expect(page.getByTestId('user-menu-button')).toContainText(
      UserProfile.name!,
    );

    const user = await api.userAccounts.getUser(TestUser.username);
    expect(user.profile.bio).toBe(UserProfile.bio);
    expect(user.profile.experienceLevel).toBe(UserProfile.experienceLevel);
    expect(user.profile.logBookSharing).toBe(UserProfile.logBookSharing);
    expect(user.profile.location).toBe(UserProfile.location);
    expect(user.profile.name).toBe(UserProfile.name);
    expect(user.profile.startedDiving).toBe(UserProfile.startedDiving);
  });

  test('will allow users to upload an avatar', async ({ page }) => {
    await page.goto('/profile');

    await page.getByTestId('btn-change-avatar').click();
    await page
      .getByTestId('dialog-content')
      .getByTestId('upload-avatar')
      .setInputFiles(resolve(__dirname, '../fixtures/test-image.jpg'));
    await page
      .getByTestId('dialog-modal')
      .getByTestId('btn-save-image')
      .click();

    await expect(page.getByTestId('dialog-content')).not.toBeVisible();
    await expect(page.getByTestId('profile-avatar')).toHaveAttribute(
      'src',
      `/api/users/${TestUser.username}/avatar/128x128`,
    );

    await page.getByTestId('btn-delete-avatar').click();
    await page.getByTestId('dialog-confirm-button').click();

    await expect(page.getByTestId('dialog-content')).not.toBeVisible();
    await expect(page.getByTestId('profile-avatar')).toHaveAttribute(
      'src',
      `https://ui-avatars.com/api/?name=${TestUser.username}`,
    );
  });

  test('will allow users to update their settings', async ({ api, page }) => {
    await page.goto('/settings');

    await page.getByText('Feet (ft)').click();
    await page.getByText('PSI').click();
    await page.getByText('Fahrenheit (°F)').click();
    await page.getByText('Pounds (lb)').click();
    await page.getByTestId('save-settings').click();

    await expect(page.getByTestId('toast-settings-saved')).toBeVisible();

    const user = await api.userAccounts.getUser(TestUser.username);
    expect(user.settings.depthUnit).toBe(DepthUnit.Feet);
    expect(user.settings.pressureUnit).toBe(PressureUnit.PSI);
    expect(user.settings.temperatureUnit).toBe(TemperatureUnit.Fahrenheit);
    expect(user.settings.weightUnit).toBe(WeightUnit.Pounds);
  });

  test('will allow users to manage their notifications', async ({
    api,
    page,
  }) => {
    await page.goto('/settings');
    await page.getByTestId('notify-email-membership.invoiceCreated').uncheck();
    await page.getByTestId('notify-email-membership.paymentFailed').uncheck();
    await page.getByTestId('notify-email-membership.trialEnding').uncheck();
    await page.getByTestId('notify-email-friendRequest.accepted').uncheck();
    await page.getByTestId('notify-email-friendRequest.rejected').uncheck();
    await page
      .getByTestId('notify-pushNotification-friendRequest.accepted')
      .uncheck();
    await page
      .getByTestId('notify-pushNotification-friendRequest.rejected')
      .uncheck();
    await page.getByTestId('btn-save-notifications').click();
    await page.waitForSelector('[data-testid="toast-notifications-saved"]');

    const user = await api.userAccounts.getUser(TestUser.username);
    const whitelists = await api.userProfiles.getNotificationWhitelists(
      user.username,
    );
    expect(whitelists).toEqual({
      email: [
        'user.*',
        'membership.canceled',
        'membership.changed',
        'membership.created',
        'friendRequest.created',
      ],
      pushNotification: ['user.*', 'membership.*', 'friendRequest.created'],
    });
  });

  test('will allow users to change their username', async ({ api, page }) => {
    const newUsername = 'Julian_23';
    await page.goto('/account');

    await page.getByTestId('edit-username').click();
    await page.getByTestId('username').fill('Julian_23');
    await page.getByTestId('save-username').click();

    await expect(page.getByTestId('toast-username-changed')).toBeVisible();
    await expect(page.getByTestId('username-value')).toHaveText(newUsername);

    await api.userAccounts.getUser(newUsername);
  });

  test('will allow users to change their email address', async ({
    api,
    page,
  }) => {
    const newEmail = 'julian@gmail.com';
    await page.goto('/account');

    await page.getByTestId('edit-email').click();
    await page.getByTestId('email').fill(newEmail);
    await page.getByTestId('save-email').click();

    await expect(page.getByTestId('toast-email-changed')).toBeVisible();
    await expect(page.getByTestId('email-value')).toHaveText(newEmail);

    await api.userAccounts.getUser(newEmail);
  });

  test('will allow users to change their password', async ({ api, page }) => {
    const newPassword = 'S!ckN3wP@ssw0rd__';
    await page.goto('/account');

    await page.getByTestId('change-password').click();
    await page.getByTestId('oldPassword').fill(TestPassword);
    await page.getByTestId('newPassword').fill(newPassword);
    await page.getByTestId('confirmPassword').fill(newPassword);
    await page.getByTestId('confirm-change-password').click();

    await expect(page.getByTestId('toast-password-changed')).toBeVisible();

    await api.auth.login(TestUser.username, newPassword);
  });

  test('will allow user to reset a forgotten password', async ({
    api,
    auth,
    db,
    page,
  }) => {
    const username = 'bubbles7';
    const newPassword = 'Sup3r__sTr0ng!!';
    await api.userAccounts.createUser({
      username,
      email: 'bubbles@mail.org.com',
      password: 'N0pe!!3333333',
    });

    // Uh oh! I've forgotten my password. I'll request a reset email...
    await auth.logout();
    await page.goto('/');
    await page.getByTestId('login-button').click();
    await page.getByRole('link', { name: 'Recover them here' }).click();
    await page.waitForURL('**/resetPassword');

    await page.waitForSelector('[data-testid="username"]');
    await page.getByTestId('username').fill('Bubbles7');
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByTestId('email-sent-message')).toBeVisible();

    // .... Email sent.... "check my Inbox"...
    const token = await db.getPasswordResetToken(username);

    // Click the link provided and fill in the form...
    await page.goto(`/resetPassword?user=${username}&token=${token}`);
    await page.getByLabel('New password:*').fill(newPassword);
    await page.getByLabel('Confirm password:*').fill(newPassword);
    await page.getByTestId('reset-password-submit').click();
    await expect(page.getByTestId('login-form')).toBeVisible();

    // Phew! Now I can login with my new password...
    await page.getByTestId('login-username').fill(username);
    await page.getByTestId('login-password').fill(newPassword);
    await page.getByTestId('login-password').press('Enter');
    await expect(page.getByTestId('user-menu-button')).toContainText(
      'bubbles7',
    );
  });
});
