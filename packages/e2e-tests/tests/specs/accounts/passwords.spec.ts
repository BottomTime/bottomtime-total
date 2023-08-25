import { expect, test } from '../../fixture';
import { fakeUser } from '@tests/fixtures/fake-user';
import { Collections, UserDocument } from '@/data';

test.skip('As a user, I can reset my forgotten password', async ({
  app,
  page,
}) => {
  const userData = fakeUser();
  const mongoClient = await app.mongoClient();
  const Users = mongoClient.db().collection<UserDocument>(Collections.Users);
  await Users.insertOne(userData);

  await page.goto('/resetPassword');
  await page.type('input#usernameOrEmail', userData.username.toUpperCase());
  await page.click('button#btn-submit-reset-request');

  await expect(page.locator('article#msg-request-submitted').isVisible()).toBe(
    true,
  );

  // User should have a reset token at this point...
  const user = await Users.findOne({ username: userData.username })!;

  // Now we can reset with a new password...

  // TODO: Finish me!
});

test.afterEach(async ({ app }) => {
  await app.purgeDatabase();
});
