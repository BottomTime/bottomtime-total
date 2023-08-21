import { expect, test } from '../../fixture';

const UserData = {
  _id: 'e533c573-eef5-4851-a5a3-e6c65f9fb792',
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date('2023-04-28T23:30:42.343Z'),
  role: 'user',
  username: 'RickyB_26',
  usernameLowered: 'rickyb_26',
  email: 'ShakeNBake@gmail.org',
  emailLowered: 'shakenbake@gmail.org',
  passwordHash: '$2b$04$Jj5IQ1ZN30d7MUcSAOFXX.YM9x8JMPjfglPvSD6vjY6T8Dd0pkbSO',
  lastLogin: new Date('2023-04-28T23:30:44.008Z'),
  profile: {
    profileVisibility: 'private',
    name: 'Ricky Bobby',
  },
};

test('Will log a user into their account with username and password', async ({
  app,
  page,
}) => {
  const mongoClient = await app.mongoClient();
  const Users = mongoClient.db().collection<{ _id: string }>('Users');

  await Users.insertOne(UserData);

  await page.goto('/login');
  await page.locator('input#usernameOrEmail').type(UserData.username);
  await page.locator('input#password').type('Password1');
  await page.locator('button#btn-login').click();

  await expect(page).toHaveURL('/');
  await expect(page.locator('a#nav-current-user')).toContainText(
    UserData.profile.name,
  );
});
