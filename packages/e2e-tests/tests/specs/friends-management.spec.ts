import { FriendRequestDirection } from '@bottomtime/api';

import { expect, test } from '../fixtures';

const Username = 'ralph';
const Password = 'R@lphage23134__';

test.describe('Friends Management', () => {
  test.beforeEach(async ({ auth, api }) => {
    await api.users.createUser({
      username: Username,
      password: Password,
    });
    await auth.login(Username, Password);
  });

  test.only('will allow a user to search for a user and send a friend request', async ({
    api,
    friends,
    page,
  }) => {
    const { id: friendId } = await api.users.createUser({
      username: 'Elroy_Carter',
      profile: {
        name: 'Elroy Carter',
      },
    });

    await friends.gotoFriends();
    await friends.addFriend('carter', 'Elroy_Carter');

    await expect(page.getByTestId(`select-request-${friendId}`)).toHaveText(
      'Elroy Carter',
    );

    const results = await api.friends.listFriendRequests(Username, {
      direction: FriendRequestDirection.Outgoing,
    });
    expect(results.friendRequests).toHaveLength(1);
    expect(results.friendRequests[0].friend.username).toBe('Elroy_Carter');
  });

  test('will allow a user to accept a friend request', async () => {});

  test('will allow a user to cancel a friend request', async ({
    api,
    page,
  }) => {
    const { id: friendId } = await api.users.createUser({
      username: 'Elroy_Carter',
      profile: {
        name: 'Elroy Carter',
      },
    });
    await api.friends.createFriendRequest(Username, 'Elroy_Carter');

    await page.getByTestId('user-menu-button').click();
    await page.getByRole('link', { name: 'Friends' }).click();
    await page.getByTestId('add-friend').click();
    await page.getByTestId('search-users').fill('carter');
    await page.getByTestId('search-users').press('Enter');
    await page.getByTestId('send-request-Elroy_Carter').click();
    await expect(page.getByTestId(`select-request-${friendId}`)).toHaveText(
      'Elroy Carter',
    );
    await page
      .getByTestId('cancel-request-fca0adda-9dde-4023-85be-2f59ccfc011c')
      .click();
    await page.getByTestId('dialog-confirm-button').click();
  });

  test('will allow a user to unfriend another user', async () => {});

  test("will allow a user to navigate to a friend's profile", async () => {});
});
