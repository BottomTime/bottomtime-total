import { expect, test } from '../../fixture';

import RegularUser from '../../fixtures/regular-user.json';

test.describe('Resetting passwords', () => {
  test('Will complete a password reset if all goes well', async ({
    app,
    page,
  }) => {
    const mongoClient = await app.mongoClient();
    const Users = mongoClient.db().collection<{ _id: string }>('Users');
    await Users.insertOne(RegularUser);

    await page.goto('/resetPassword');
    await page.type(
      'input#usernameOrEmail',
      RegularUser.username.toUpperCase(),
    );
    await page.click('button#btn-submit-reset-request');

    await expect(
      page.locator('article#msg-request-submitted').isVisible(),
    ).toBe(true);
  });
});
