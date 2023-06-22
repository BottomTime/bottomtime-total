import { expect, test } from '../../fixture';

const UserData = require('../../fixtures/regular-user.json');

test('Will log a user into their account with username and password', async ({
  app,
  page,
}) => {
  const mongoClient = await app.mongoClient();
  const Users = mongoClient.db().collection('Users');

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
