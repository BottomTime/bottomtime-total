import mockFetch from 'fetch-mock-jest';

import {
  ApiList,
  Friend,
  FriendDTO,
  FriendRequest,
  FriendRequestDTO,
  FriendRequestDirection,
  FriendsSortBy,
  ListFriendRequestsParamsDTO,
  ListFriendRequestsResponseSchema,
  ListFriendsParamsDTO,
  ListFriendsResposneSchema,
  SortOrder,
} from '../../src';
import { Fetcher } from '../../src/client/fetcher';
import { FriendsApiClient } from '../../src/client/friends';
import FriendRequestTestData from '../fixtures/friend-requests-search-results.json';
import FriendTestData from '../fixtures/friends-search-results.json';

const Username = 'mega_user32';

describe('Friends API client', () => {
  let fetcher: Fetcher;
  let client: FriendsApiClient;
  let friendsData: ApiList<FriendDTO>;
  let friendRequestData: ApiList<FriendRequestDTO>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new FriendsApiClient(fetcher);

    friendsData = ListFriendsResposneSchema.parse(FriendTestData);
    friendRequestData = ListFriendRequestsResponseSchema.parse(
      FriendRequestTestData,
    );
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will perform basic search for friends', async () => {
    mockFetch.get(`/api/users/${Username}/friends`, {
      status: 200,
      body: friendsData,
    });
    const result = await client.listFriends(Username);

    expect(mockFetch.done()).toBe(true);
    expect(result.totalCount).toBe(friendsData.totalCount);
    expect(result.data).toHaveLength(friendsData.data.length);
    result.data.forEach((friend, index) => {
      expect(friend.id).toBe(friendsData.data[index].id);
      expect(friend.username).toBe(friendsData.data[index].username);
      expect(friend.avatar).toBe(friendsData.data[index].avatar);
      expect(friend.location).toBe(friendsData.data[index].location);
      expect(friend.name).toBe(friendsData.data[index].name);
      expect(friend.memberSince).toEqual(friendsData.data[index].memberSince);
      expect(friend.logBookSharing).toBe(
        friendsData.data[index].logBookSharing,
      );
    });
  });

  it('will perform a search for friends with parameters', async () => {
    const options: ListFriendsParamsDTO = {
      sortBy: FriendsSortBy.Username,
      sortOrder: SortOrder.Ascending,
      skip: 20,
      limit: 10,
    };

    mockFetch.get(
      `/api/users/${Username}/friends?sortBy=username&sortOrder=asc&skip=20&limit=10`,
      {
        status: 200,
        body: friendsData,
      },
    );

    const result = await client.listFriends(Username, options);

    expect(mockFetch.done()).toBe(true);
    expect(result.totalCount).toBe(friendsData.totalCount);
    expect(result.data).toHaveLength(friendsData.data.length);
    result.data.forEach((friend, index) => {
      expect(friend.id).toBe(friendsData.data[index].id);
      expect(friend.username).toBe(friendsData.data[index].username);
      expect(friend.avatar).toBe(friendsData.data[index].avatar);
      expect(friend.location).toBe(friendsData.data[index].location);
      expect(friend.name).toBe(friendsData.data[index].name);
      expect(friend.memberSince).toEqual(friendsData.data[index].memberSince);
      expect(friend.logBookSharing).toBe(
        friendsData.data[index].logBookSharing,
      );
    });
  });

  it('will return a single friend', async () => {
    const data = friendsData.data[0];
    mockFetch.get(`/api/users/${Username}/friends/${data.username}`, {
      status: 200,
      body: data,
    });

    const friend = await client.getFriend(Username, data.username);

    expect(mockFetch.done()).toBe(true);
    expect(friend.toJSON()).toEqual(data);
  });

  it('will return true if areFriends is called and the two users are friends', async () => {
    const friend = 'my_homie';
    mockFetch.head(`/api/users/${Username}/friends/${friend}`, 200);
    await expect(client.areFriends(Username, friend)).resolves.toBe(true);
    expect(mockFetch.done()).toBe(true);
  });

  it('will return false if areFriends is called and the two users are not friends', async () => {
    const friend = 'my_homie';
    mockFetch.head(`/api/users/${Username}/friends/${friend}`, 404);
    await expect(client.areFriends(Username, friend)).resolves.toBe(false);
    expect(mockFetch.done()).toBe(true);
  });

  it('will perform a basic search for friend requests', async () => {
    mockFetch.get(`/api/users/${Username}/friendRequests`, {
      status: 200,
      body: friendRequestData,
    });

    const result = await client.listFriendRequests(Username);

    expect(mockFetch.done()).toBe(true);
    expect(result.totalCount).toBe(friendRequestData.totalCount);
    expect(result.data).toHaveLength(friendRequestData.data.length);
    result.data.forEach((request, index) => {
      expect(request.toJSON()).toEqual(friendRequestData.data[index]);
    });
  });

  it('will perform a search for friend requests with parameters', async () => {
    const options: ListFriendRequestsParamsDTO = {
      direction: FriendRequestDirection.Incoming,
      showAcknowledged: true,
      showExpired: true,
      skip: 20,
      limit: 10,
    };

    mockFetch.get(
      `/api/users/${Username}/friendRequests?direction=incoming&showAcknowledged=true&showExpired=true&skip=20&limit=10`,
      {
        status: 200,
        body: friendRequestData,
      },
    );

    const result = await client.listFriendRequests(Username, options);

    expect(mockFetch.done()).toBe(true);
    expect(result.totalCount).toBe(friendRequestData.totalCount);
    expect(result.data).toHaveLength(friendRequestData.data.length);
    result.data.forEach((request, index) => {
      expect(request.toJSON()).toEqual(friendRequestData.data[index]);
    });
  });

  it('will create a friend request', async () => {
    const expected = friendRequestData.data[0];
    mockFetch.put(
      `/api/users/${Username}/friendRequests/${expected.friend.username}`,
      {
        status: 201,
        body: expected,
      },
    );

    const request = await client.createFriendRequest(
      Username,
      expected.friend.username,
    );

    expect(mockFetch.done()).toBe(true);
    expect(request.toJSON()).toEqual(expected);
  });

  it('will wrap a friend DTO', () => {
    const data = friendsData.data[0];
    const friend = client.wrapFriendDTO(Username, data);

    expect(friend).toBeInstanceOf(Friend);
    expect(friend.toJSON()).toEqual(data);
  });

  it('will wrap a friend request DTO', () => {
    const data = friendRequestData.data[0];
    const request = client.wrapFriendRequestDTO(Username, data);

    expect(request).toBeInstanceOf(FriendRequest);
    expect(request.toJSON()).toEqual(data);
  });
});
