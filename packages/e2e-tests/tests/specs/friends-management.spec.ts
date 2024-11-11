import { FriendRequestDirection } from '@bottomtime/api';

import { expect, test } from '../fixtures';

const Username = 'ralph';
const Password = 'R@lphage23134__';

test.describe('Friends Management', () => {
  test.beforeEach(async ({ api, auth }) => {
    await api.users.createUser({
      username: Username,
      password: Password,
    });
    await auth.login(Username, Password);
  });

  test('will allow a user to search for a user and send a friend request', async ({
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
    expect(results.data).toHaveLength(1);
    expect(results.data[0].friend.username).toBe('Elroy_Carter');
  });

  test('will allow a user to accept a friend request', async ({
    api,
    friends,
    page,
  }) => {
    const friendUsername = 'jimmy_T';
    const { id: friendId } = await api.users.createUser({
      username: friendUsername,
      profile: {
        name: 'Jimmy McJimmerson',
      },
    });
    await api.friends.createFriendRequest(friendUsername, Username);

    await friends.gotoFriendRequests();
    await friends.acceptFriendRequest(friendId);
    await friends.gotoFriends();

    const friendsData = await api.friends.listFriends(Username);
    expect(friendsData.data).toHaveLength(1);
    expect(friendsData.data[0].username).toBe(friendUsername);

    await expect(
      page.getByTestId(`select-friend-${friendUsername}`),
    ).toHaveText('Jimmy McJimmerson');
  });

  test('will allow a user to decline a friend request with a reason', async ({
    api,
    friends,
  }) => {
    const friendUsername = 'bob1';
    const reason = 'Stranger danger!!';
    const { id: friendId } = await api.users.createUser({
      username: friendUsername,
      profile: {
        name: 'Bob McBobberson',
      },
    });
    await api.friends.createFriendRequest(friendUsername, Username);

    await friends.gotoFriendRequests();
    await friends.declineFriendRequest(friendId, reason);

    const [friendsData, friendRequests] = await Promise.all([
      api.friends.listFriends(Username),
      api.friends.listFriendRequests(friendUsername, {
        showAcknowledged: true,
      }),
    ]);
    expect(friendsData.data).toHaveLength(0);
    expect(friendRequests.data).toHaveLength(1);
    expect(friendRequests.data[0].declineReason).toBe(reason);
  });

  test('will allow a user to cancel a friend request', async ({
    api,
    friends,
    page,
  }) => {
    const { id: friendId } = await api.users.createUser({
      username: 'Jenn32',
      profile: {
        name: 'Jenny Boyd',
      },
    });
    await api.friends.createFriendRequest(Username, 'Jenn32');

    await friends.gotoFriends();
    await expect(page.getByTestId(`select-request-${friendId}`)).toHaveText(
      'Jenny Boyd',
    );
    await page.getByTestId(`cancel-request-${friendId}`).click();
    await page.getByTestId('dialog-confirm-button').click();

    await expect(
      page.getByTestId(`select-request-${friendId}`),
    ).not.toBeVisible();

    const { totalCount } = await api.friends.listFriendRequests(Username);
    expect(totalCount).toBe(0);
  });

  test('will allow a user to unfriend another user', async ({
    api,
    friends,
    page,
  }) => {
    const friendUsername = 'Jenn32';
    const { id: friendId } = await api.users.createUser({
      username: friendUsername,
      profile: {
        name: 'Jenny Boyd',
      },
    });
    const request = await api.friends.createFriendRequest(
      Username,
      friendUsername,
    );
    await request.accept();

    await friends.gotoFriends();
    await friends.unfriend(friendUsername);
    await page.reload();
    await expect(
      page.getByTestId(`select-friend-${friendId}`),
    ).not.toBeVisible();
  });

  test("will allow a user to navigate to a friend's profile", async ({
    api,
    friends,
    page,
  }) => {
    const friendUsername = 'Jenn32';
    await api.users.createUser({
      username: friendUsername,
      profile: {
        name: 'Jenny Boyd',
      },
    });
    const request = await api.friends.createFriendRequest(
      Username,
      friendUsername,
    );
    await request.accept();

    await friends.gotoFriends();
    await friends.openFriendProfile(friendUsername);

    await expect(page.getByTestId('profile-name')).toHaveText('Jenny Boyd');
  });
});
