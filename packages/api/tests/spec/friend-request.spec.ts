import mockFetch from 'fetch-mock-jest';

import {
  FriendRequestDTO,
  FriendRequestDirection,
  LogBookSharing,
} from '../../src';
import { FriendRequest } from '../../src/client';
import { Fetcher } from '../../src/client/fetcher';

const Username = 'mega_user32';
const FriendId = '5e83b728-c7ba-4d9f-aaf4-5341640dd974';
const TestData: FriendRequestDTO = {
  created: new Date('2202-12-01'),
  expires: new Date('2025-04-21'),
  direction: FriendRequestDirection.Incoming,
  friendId: FriendId,
  friend: {
    id: FriendId,
    username: 'paul_friendo',
    logBookSharing: LogBookSharing.FriendsOnly,
    memberSince: new Date('2020-01-04'),
    avatar: 'https://example.com/avatar.jpg',
    location: 'Under the sea',
    name: 'Paul Friendo',
  },
  accepted: false,
  reason: 'nope',
};

function getCancelPath(direction: FriendRequestDirection): string {
  return direction === FriendRequestDirection.Outgoing
    ? `/api/users/${Username}/friendRequests/${TestData.friend.username}`
    : `/api/users/${TestData.friend.username}/friendRequests/${Username}`;
}

function getAcknowledgePath(direction: FriendRequestDirection): string {
  return direction === FriendRequestDirection.Incoming
    ? `/api/users/${Username}/friendRequests/${TestData.friend.username}/acknowledge`
    : `/api/users/${TestData.friend.username}/friendRequests/${Username}/acknowledge`;
}

describe('FriendRequest class', () => {
  let client: Fetcher;

  let data: FriendRequestDTO;
  let request: FriendRequest;

  beforeAll(() => {
    client = new Fetcher();
  });

  beforeEach(() => {
    data = { ...TestData };
    request = new FriendRequest(client, Username, data);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return properties correctly', () => {
    expect(request.accepted).toBe(TestData.accepted);
    expect(request.created).toBe(TestData.created);
    expect(request.declineReason).toBe(TestData.reason);
    expect(request.direction).toBe(TestData.direction);
    expect(request.expires).toBe(TestData.expires);
    expect(request.friend).toEqual(TestData.friend);
  });

  it('will return undefined for optional properties', () => {
    data.accepted = undefined;
    data.reason = undefined;
    expect(request.accepted).toBeUndefined();
    expect(request.declineReason).toBeUndefined();
  });

  it('will render correctly as JSON', () => {
    expect(request.toJSON()).toEqual(TestData);
  });

  [FriendRequestDirection.Incoming, FriendRequestDirection.Outgoing].forEach(
    (direction) => {
      describe(`for ${direction} requests`, () => {
        beforeEach(() => {
          data.direction = direction;
          data.accepted = undefined;
          data.reason = undefined;
        });

        it('will cancel/delete a friend request', async () => {
          mockFetch.delete(getCancelPath(direction), 204);
          await request.cancel();
          expect(mockFetch.done()).toBe(true);
        });

        it('will accept a friend request', async () => {
          mockFetch.post(
            {
              url: getAcknowledgePath(direction),
              body: { accepted: true },
            },
            204,
          );
          await request.accept();
          expect(mockFetch.done()).toBe(true);
          expect(request.accepted).toBe(true);
        });

        it('will decline a friend request', async () => {
          const reason = 'hella nope';
          mockFetch.post(
            {
              url: getAcknowledgePath(direction),
              body: { accepted: false, reason },
            },
            204,
          );
          await request.decline(reason);
          expect(mockFetch.done()).toBe(true);
          expect(request.accepted).toBe(false);
          expect(request.declineReason).toBe(reason);
        });
      });
    },
  );
});
