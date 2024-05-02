import axios, { AxiosInstance } from 'axios';
import nock, { Scope } from 'nock';

import {
  FriendRequestDTO,
  FriendRequestDirection,
  LogBookSharing,
} from '../../src';
import { FriendRequest } from '../../src/client';
import { createScope } from '../fixtures/nock';

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
  let client: AxiosInstance;
  let scope: Scope;

  let data: FriendRequestDTO;
  let request: FriendRequest;

  beforeAll(() => {
    client = axios.create();
    scope = createScope();
  });

  beforeEach(() => {
    data = { ...TestData };
    request = new FriendRequest(client, Username, data);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
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
          scope.delete(getCancelPath(direction)).reply(204);
          await request.cancel();
          expect(scope.isDone()).toBe(true);
        });

        it('will accept a friend request', async () => {
          scope
            .post(getAcknowledgePath(direction), { accepted: true })
            .reply(204);
          await request.accept();
          expect(scope.isDone()).toBe(true);
          expect(request.accepted).toBe(true);
        });

        it('will decline a friend request', async () => {
          const reason = 'hella nope';
          scope
            .post(getAcknowledgePath(direction), { accepted: false, reason })
            .reply(204);
          await request.decline(reason);
          expect(scope.isDone()).toBe(true);
          expect(request.accepted).toBe(false);
          expect(request.declineReason).toBe(reason);
        });
      });
    },
  );
});
