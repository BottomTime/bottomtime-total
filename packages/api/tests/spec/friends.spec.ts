import axios, { AxiosInstance } from 'axios';
import nock, { Scope } from 'nock';

import {
  Friend,
  FriendRequest,
  FriendRequestDirection,
  FriendsSortBy,
  ListFriendRequestsParams,
  ListFriendRequestsResponseDTO,
  ListFriendRequestsResponseSchema,
  ListFriendsParams,
  ListFriendsResponseDTO,
  ListFriendsResposneSchema,
  SortOrder,
} from '../../src';
import { FriendsApiClient } from '../../src/client/friends';
import FriendRequestTestData from '../fixtures/friend-requests-search-results.json';
import FriendTestData from '../fixtures/friends-search-results.json';
import { createScope } from '../fixtures/nock';

const Username = 'mega_user32';

describe('Friends API client', () => {
  let axiosClient: AxiosInstance;
  let client: FriendsApiClient;
  let scope: Scope;
  let friendsData: ListFriendsResponseDTO;
  let friendRequestData: ListFriendRequestsResponseDTO;

  beforeAll(() => {
    axiosClient = axios.create();
    scope = createScope();
    client = new FriendsApiClient(axiosClient);

    friendsData = ListFriendsResposneSchema.parse(FriendTestData);
    friendRequestData = ListFriendRequestsResponseSchema.parse(
      FriendRequestTestData,
    );
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('will perform basic search for friends', async () => {
    scope.get(`/api/users/${Username}/friends`).reply(200, friendsData);
    const result = await client.listFriends(Username);

    expect(scope.isDone()).toBe(true);
    expect(result.totalCount).toBe(friendsData.totalCount);
    expect(result.friends).toHaveLength(friendsData.friends.length);
    result.friends.forEach((friend, index) => {
      expect(friend.id).toBe(friendsData.friends[index].id);
      expect(friend.username).toBe(friendsData.friends[index].username);
      expect(friend.avatar).toBe(friendsData.friends[index].avatar);
      expect(friend.location).toBe(friendsData.friends[index].location);
      expect(friend.name).toBe(friendsData.friends[index].name);
      expect(friend.memberSince).toEqual(
        friendsData.friends[index].memberSince,
      );
      expect(friend.logBookSharing).toBe(
        friendsData.friends[index].logBookSharing,
      );
    });
  });

  it('will perform a search for friends with parameters', async () => {
    const options: ListFriendsParams = {
      sortBy: FriendsSortBy.Username,
      sortOrder: SortOrder.Ascending,
      skip: 20,
      limit: 10,
    };

    scope
      .get(`/api/users/${Username}/friends`)
      .query(options)
      .reply(200, friendsData);

    const result = await client.listFriends(Username, options);

    expect(scope.isDone()).toBe(true);
    expect(result.totalCount).toBe(friendsData.totalCount);
    expect(result.friends).toHaveLength(friendsData.friends.length);
    result.friends.forEach((friend, index) => {
      expect(friend.id).toBe(friendsData.friends[index].id);
      expect(friend.username).toBe(friendsData.friends[index].username);
      expect(friend.avatar).toBe(friendsData.friends[index].avatar);
      expect(friend.location).toBe(friendsData.friends[index].location);
      expect(friend.name).toBe(friendsData.friends[index].name);
      expect(friend.memberSince).toEqual(
        friendsData.friends[index].memberSince,
      );
      expect(friend.logBookSharing).toBe(
        friendsData.friends[index].logBookSharing,
      );
    });
  });

  it('will return a single friend', async () => {
    const data = friendsData.friends[0];
    scope
      .get(`/api/users/${Username}/friends/${data.username}`)
      .reply(200, data);

    const friend = await client.getFriend(Username, data.username);

    expect(scope.isDone()).toBe(true);
    expect(friend.toJSON()).toEqual(data);
  });

  it('will return true if areFriends is called and the two users are friends', async () => {
    const friend = 'my_homie';
    scope.head(`/api/users/${Username}/friends/${friend}`).reply(200);
    await expect(client.areFriends(Username, friend)).resolves.toBe(true);
    expect(scope.isDone()).toBe(true);
  });

  it('will return false if areFriends is called and the two users are not friends', async () => {
    const friend = 'my_homie';
    scope.head(`/api/users/${Username}/friends/${friend}`).reply(404);
    await expect(client.areFriends(Username, friend)).resolves.toBe(false);
    expect(scope.isDone()).toBe(true);
  });

  it('will allow an error to bubble up if areFriends is called and something goes wrong', async () => {
    const friend = 'my_homie';
    const error = new Error('nope');
    scope
      .head(`/api/users/${Username}/friends/${friend}`)
      .replyWithError(error);
    await expect(
      client.areFriends(Username, friend),
    ).rejects.toThrowErrorMatchingSnapshot();
    expect(scope.isDone()).toBe(true);
  });

  it('will perform a basic search for friend requests', async () => {
    scope
      .get(`/api/users/${Username}/friendRequests`)
      .reply(200, friendRequestData);

    const result = await client.listFriendRequests(Username);

    expect(scope.isDone()).toBe(true);
    expect(result.totalCount).toBe(friendRequestData.totalCount);
    expect(result.friendRequests).toHaveLength(
      friendRequestData.friendRequests.length,
    );
    result.friendRequests.forEach((request, index) => {
      expect(request.toJSON()).toEqual(friendRequestData.friendRequests[index]);
    });
  });

  it('will perform a search for friend requests with parameters', async () => {
    const options: ListFriendRequestsParams = {
      direction: FriendRequestDirection.Incoming,
      showAcknowledged: true,
      showExpired: true,
      skip: 20,
      limit: 10,
    };

    scope
      .get(`/api/users/${Username}/friendRequests`)
      .query(options)
      .reply(200, friendRequestData);

    const result = await client.listFriendRequests(Username, options);

    expect(scope.isDone()).toBe(true);
    expect(result.totalCount).toBe(friendRequestData.totalCount);
    expect(result.friendRequests).toHaveLength(
      friendRequestData.friendRequests.length,
    );
    result.friendRequests.forEach((request, index) => {
      expect(request.toJSON()).toEqual(friendRequestData.friendRequests[index]);
    });
  });

  it('will create a friend request', async () => {
    const expected = friendRequestData.friendRequests[0];
    scope
      .put(`/api/users/${Username}/friendRequests/${expected.friend.username}`)
      .reply(201, expected);

    const request = await client.createFriendRequest(
      Username,
      expected.friend.username,
    );

    expect(scope.isDone()).toBe(true);
    expect(request.toJSON()).toEqual(expected);
  });

  it('will wrap a friend DTO', () => {
    const data = friendsData.friends[0];
    const friend = client.wrapFriendDTO(Username, data);

    expect(friend).toBeInstanceOf(Friend);
    expect(friend.toJSON()).toEqual(data);
  });

  it('will wrap a friend request DTO', () => {
    const data = friendRequestData.friendRequests[0];
    const request = client.wrapFriendRequestDTO(Username, data);

    expect(request).toBeInstanceOf(FriendRequest);
    expect(request.toJSON()).toEqual(data);
  });
});
