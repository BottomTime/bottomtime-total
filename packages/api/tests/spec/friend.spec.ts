import mockFetch from 'fetch-mock-jest';

import { FriendDTO, LogBookSharing } from '../../src';
import { Friend } from '../../src/client';
import { Fetcher } from '../../src/client/fetcher';

const Username = 'mega_user32';
const FriendId = '5e83b728-c7ba-4d9f-aaf4-5341640dd974';
const TestData: FriendDTO = {
  friendsSince: new Date('2023-12-01'),
  id: FriendId,
  logBookSharing: LogBookSharing.FriendsOnly,
  memberSince: new Date('2020-01-04'),
  username: 'paul_friendo',
  avatar: 'https://example.com/avatar.jpg',
  location: 'Under the sea',
  name: 'Paul Friendo',
};

describe('Friend class', () => {
  let client: Fetcher;

  let data: FriendDTO;
  let friend: Friend;

  beforeAll(() => {
    client = new Fetcher();
  });

  beforeEach(() => {
    data = { ...TestData };
    friend = new Friend(client, Username, data);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return properties correctly', () => {
    expect(friend.id).toBe(FriendId);
    expect(friend.friendsSince).toEqual(TestData.friendsSince);
    expect(friend.username).toBe(TestData.username);
    expect(friend.avatar).toBe(TestData.avatar);
    expect(friend.location).toBe(TestData.location);
    expect(friend.name).toBe(TestData.name);
    expect(friend.memberSince).toEqual(TestData.memberSince);
    expect(friend.logBookSharing).toBe(TestData.logBookSharing);
  });

  it('will return optional properties as undefined', () => {
    data.avatar = undefined;
    data.location = undefined;
    data.name = undefined;
    expect(friend.avatar).toBeUndefined();
    expect(friend.location).toBeUndefined();
    expect(friend.name).toBeUndefined();
  });

  it('will render as JSON correctly', () => {
    expect(friend.toJSON()).toEqual(TestData);
  });

  it('will unfriend a user', async () => {
    mockFetch.delete(
      `/api/users/${Username}/friends/${TestData.username}`,
      204,
    );
    await friend.unfriend();
    expect(mockFetch.done()).toBe(true);
  });
});
