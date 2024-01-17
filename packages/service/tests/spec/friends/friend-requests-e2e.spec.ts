import {
  DepthUnit,
  FriendRequestDirection,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';
import {
  FriendModel,
  FriendRequestModel,
  UserData,
  UserModel,
} from '../../../src/schemas';
import { createAuthHeader, createTestApp } from '../../utils';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import TestUserData from '../../fixtures/users.json';
import TestFriendRequestData from '../../fixtures/friend-requests.json';
import { v4 as uuid } from 'uuid';

const TwoWeeksInMilliseconds = 14 * 24 * 60 * 60 * 1000;

const AdminUserId = 'F3669787-82E5-458F-A8AD-98D3F57DDA6E';
const AdminUserData: UserData = {
  _id: AdminUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
  settings: {
    depthUnit: DepthUnit.Meters,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
    pressureUnit: PressureUnit.Bar,
    profileVisibility: ProfileVisibility.Private,
  },
};

const RegularUserId = '5A4699D8-48C4-4410-9886-B74B8B85CAC1';
const RegularUserData: UserData = {
  _id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  settings: {
    depthUnit: DepthUnit.Meters,
    temperatureUnit: TemperatureUnit.Celsius,
    weightUnit: WeightUnit.Kilograms,
    pressureUnit: PressureUnit.Bar,
    profileVisibility: ProfileVisibility.Private,
  },
};

function friendRequestUrl(username: string, friend?: string): string {
  return friend
    ? `/api/users/${username}/friendRequests/${friend}`
    : `/api/users/${username}/friendRequests`;
}

function acknowledgeRequestUrl(username: string, friend: string): string {
  return `/api/users/${username}/friendRequests/${friend}/acknowledge`;
}

async function insertFriendRequests(
  userId: string,
  count?: number,
): Promise<void> {
  count ??= TestFriendRequestData.length;
  const friendRequests = TestFriendRequestData.slice(0, count).map(
    (friendRequest) =>
      new FriendRequestModel({
        ...friendRequest,
        _id: friendRequest.to,
        from: userId,
      }),
  );
  const friends = TestUserData.slice(0, count).map(
    (user) => new UserModel(user),
  );
  await Promise.all([
    UserModel.insertMany(friends),
    FriendRequestModel.insertMany(friendRequests),
  ]);
}

describe('Friend Requests End-to-End Tests', () => {
  let app: INestApplication;
  let server: unknown;
  let adminAuthHeader: [string, string];
  let regularAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
    adminAuthHeader = await createAuthHeader(AdminUserId);
    regularAuthHeader = await createAuthHeader(RegularUserId);
  });

  beforeEach(async () => {
    const adminUser = new UserModel(AdminUserData);
    const regularUser = new UserModel(RegularUserData);
    await UserModel.insertMany([adminUser, regularUser]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing friend requests', () => {
    it('will return a 400 error if the query parameters do not pass validation', async () => {
      const { body } = await request(server)
        .get(friendRequestUrl(RegularUserData.username))
        .set(...regularAuthHeader)
        .query({ direction: 'invalid', limit: -1, sortBy: 'wat?' })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 error if the user is not logged in', async () => {
      await request(server)
        .get(friendRequestUrl(RegularUserData.username))
        .expect(401);
    });

    it('will return a 403 error if the user is not an admin and is not the user indicated in the request path', async () => {
      await request(server)
        .get(friendRequestUrl(AdminUserData.username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the user indicated in the request path does not exist', async () => {
      await request(server)
        .get(friendRequestUrl('nope.not.here'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it("will return a list of the user's friend requests", async () => {
      await insertFriendRequests(RegularUserId);
      const { body } = await request(server)
        .get(friendRequestUrl(RegularUserData.username))
        .set(...regularAuthHeader)
        .query({
          direction: FriendRequestDirection.Both,
          skip: 12,
          limit: 6,
        })
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow admins to view friend requests for any user', async () => {
      await insertFriendRequests(RegularUserId);
      const { body } = await request(server)
        .get(friendRequestUrl(RegularUserData.username))
        .set(...adminAuthHeader)
        .query({
          direction: FriendRequestDirection.Both,
          skip: 12,
          limit: 6,
        })
        .expect(200);

      expect(body).toMatchSnapshot();
    });
  });

  describe('when retrieving a single friend request', () => {
    beforeEach(async () => {
      await insertFriendRequests(RegularUserId, 4);
    });

    it('will return a 401 error if the user is not logged in', async () => {
      await request(server)
        .get(
          friendRequestUrl(RegularUserData.username, TestUserData[0].username),
        )
        .expect(401);
    });

    it('will return a 403 error if the user is not an admin and is not the user indicated in the request path', async () => {
      await request(server)
        .get(friendRequestUrl(AdminUserData.username, TestUserData[0].username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the user indicated in the request path does not exist', async () => {
      await request(server)
        .get(friendRequestUrl('nope.not.here', TestUserData[0].username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the friend indicated in the request path does not exist', async () => {
      await request(server)
        .get(friendRequestUrl(RegularUserData.username, 'nope.not.here'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the friend request does not exist', async () => {
      await request(server)
        .get(
          friendRequestUrl(RegularUserData.username, TestUserData[35].username),
        )
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return the requested friend request', async () => {
      const { body } = await request(server)
        .get(
          friendRequestUrl(RegularUserData.username, TestUserData[1].username),
        )
        .set(...regularAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will allow admins to view friend requests for any user', async () => {
      const { body } = await request(server)
        .get(
          friendRequestUrl(RegularUserData.username, TestUserData[2].username),
        )
        .set(...adminAuthHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });
  });

  describe('when creating friend requests', () => {
    beforeEach(async () => {
      const friend = new UserModel(TestUserData[0]);
      await friend.save();
    });

    it('will return a 400 error if the user attempts to send a friend request to themselves', async () => {
      await request(server)
        .put(
          friendRequestUrl(RegularUserData.username, RegularUserData.username),
        )
        .set(...regularAuthHeader)
        .expect(400);
    });

    it('will return a 401 error if the user is not logged in', async () => {
      await request(server)
        .put(
          friendRequestUrl(RegularUserData.username, TestUserData[0].username),
        )
        .expect(401);
    });

    it('will return a 403 error if the user is not an admin and is not the user indicated in the request path', async () => {
      await request(server)
        .put(friendRequestUrl(AdminUserData.username, TestUserData[0].username))
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the user indicated in the request path does not exist', async () => {
      await request(server)
        .put(friendRequestUrl('nope.not.here', TestUserData[0].username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the friend indicated in the request path does not exist', async () => {
      await request(server)
        .put(friendRequestUrl(RegularUserData.username, 'nope.not.here'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 409 error if the friend request already exists', async () => {
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: RegularUserId,
        to: TestUserData[0]._id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
      });
      await friendRequest.save();

      await request(server)
        .put(
          friendRequestUrl(RegularUserData.username, TestUserData[0].username),
        )
        .set(...regularAuthHeader)
        .expect(409);
    });

    it('will return a 409 error if the users are already friends', async () => {
      const friendsSince = new Date('2020-01-01');
      const friendRelations = [
        new FriendModel({
          _id: uuid(),
          userId: RegularUserId,
          friendId: TestUserData[0]._id,
          friendsSince,
        }),
        new FriendModel({
          _id: uuid(),
          userId: TestUserData[0]._id,
          friendId: RegularUserId,
          friendsSince,
        }),
      ];
      await FriendModel.insertMany(friendRelations);

      await request(server)
        .put(
          friendRequestUrl(RegularUserData.username, TestUserData[0].username),
        )
        .set(...regularAuthHeader)
        .expect(409);
    });

    it('will return the created friend request when the operation succeeds', async () => {
      const { body } = await request(server)
        .put(
          friendRequestUrl(RegularUserData.username, TestUserData[0].username),
        )
        .set(...regularAuthHeader)
        .expect(201);

      const friendRequest = await FriendRequestModel.findOne({
        from: RegularUserId,
        to: TestUserData[0]._id,
      });
      expect(friendRequest).not.toBeNull();

      expect(new Date(body.created).valueOf()).toBeCloseTo(Date.now(), -2);
      expect(body.direction).toBe(FriendRequestDirection.Outgoing);
      expect(new Date(body.expires).valueOf()).toBeCloseTo(
        Date.now() + TwoWeeksInMilliseconds,
        -2,
      );
      expect(body.friendId).toEqual(TestUserData[0]._id);
    });
  });

  describe('when cancelling a friend request', () => {
    beforeEach(async () => {
      const friend = new UserModel(TestUserData[0]);
      const friendRequest = new FriendRequestModel({
        _id: uuid(),
        from: RegularUserId,
        to: TestUserData[0]._id,
        created: new Date(),
        expires: new Date(Date.now() + 10000),
      });

      await Promise.all([friend.save(), friendRequest.save()]);
    });

    it('will return a 401 error if user is not logged in', async () => {
      await request(server)
        .delete(
          friendRequestUrl(RegularUserData.username, TestUserData[0].username),
        )
        .expect(401);
    });

    it('will return a 403 error if user is not an admin and did not create the friend request', async () => {
      await request(server)
        .delete(
          friendRequestUrl(AdminUserData.username, TestUserData[0].username),
        )
        .set(...regularAuthHeader)
        .expect(403);
    });

    it('will return a 404 error if the target user does not exist', async () => {
      await request(server)
        .delete(friendRequestUrl('not.a.user', TestUserData[0].username))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the target friend does not exist', async () => {
      await request(server)
        .delete(friendRequestUrl(RegularUserData.username, 'not.a.user'))
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will return a 404 error if the friend request does not exist', async () => {
      await request(server)
        .delete(
          friendRequestUrl(RegularUserData.username, AdminUserData.username),
        )
        .set(...regularAuthHeader)
        .expect(404);
    });

    it('will delete the requested friend request', async () => {
      await request(server)
        .delete(
          friendRequestUrl(RegularUserData.username, TestUserData[0].username),
        )
        .set(...regularAuthHeader)
        .expect(204);

      const deletedFriendRequest = await FriendRequestModel.exists({
        to: TestUserData[0]._id,
        from: RegularUserId,
      });
      expect(deletedFriendRequest).toBeNull();
    });

    it('will allow an admin to delete the requested friend request', async () => {
      await request(server)
        .delete(
          friendRequestUrl(RegularUserData.username, TestUserData[0].username),
        )
        .set(...adminAuthHeader)
        .expect(204);

      const deletedFriendRequest = await FriendRequestModel.exists({
        to: TestUserData[0]._id,
        from: RegularUserId,
      });
      expect(deletedFriendRequest).toBeNull();
    });
  });

  [true, false].forEach((accepted) => {
    describe(`when ${
      accepted ? 'accepting' : 'declining'
    } a friend request`, () => {
      beforeEach(async () => {
        const friend = new UserModel(TestUserData[0]);
        const friendRequest = new FriendRequestModel({
          _id: uuid(),
          created: new Date(),
          expires: new Date(Date.now() + 10000),
          from: RegularUserId,
          to: TestUserData[0]._id,
        });

        await Promise.all([friend.save(), friendRequest.save()]);
      });

      it('will return a 400 error if the request body is invalid', async () => {
        await request(server)
          .post(
            acknowledgeRequestUrl(
              RegularUserData.username,
              TestUserData[0].username,
            ),
          )
          .set(...regularAuthHeader)
          .send({ invalid: 'yup' })
          .expect(400);
      });

      it('will return a 401 error if the user is not logged in', async () => {
        await request(server)
          .post(
            acknowledgeRequestUrl(
              RegularUserData.username,
              TestUserData[0].username,
            ),
          )
          .send({ accepted })
          .expect(401);
      });

      it('will return a 403 error if the user is not an admin and did not create the friend request', async () => {
        await request(server)
          .post(
            acknowledgeRequestUrl(
              AdminUserData.username,
              TestUserData[0].username,
            ),
          )
          .set(...regularAuthHeader)
          .send({ accepted })
          .expect(403);
      });

      it('will return a 404 error if the target user does not exist', async () => {
        await request(server)
          .post(acknowledgeRequestUrl('not.a.user', TestUserData[0].username))
          .set(...regularAuthHeader)
          .send({ accepted })
          .expect(404);
      });

      it('will return a 404 error if the target friend does not exist', async () => {
        await request(server)
          .post(acknowledgeRequestUrl(RegularUserData.username, 'not.a.user'))
          .set(...regularAuthHeader)
          .send({ accepted })
          .expect(404);
      });

      it('will return a 404 error if the friend request does not exist', async () => {
        await request(server)
          .post(
            acknowledgeRequestUrl(
              RegularUserData.username,
              AdminUserData.username,
            ),
          )
          .set(...regularAuthHeader)
          .send({ accepted })
          .expect(404);
      });

      if (accepted) {
        it('will create a new friend relationship when the friend request is accepted', async () => {
          await request(server)
            .post(
              acknowledgeRequestUrl(
                RegularUserData.username,
                TestUserData[0].username,
              ),
            )
            .set(...regularAuthHeader)
            .send({ accepted: true })
            .expect(204);

          const [friendRelations, friendRequest] = await Promise.all([
            FriendModel.find({
              $or: [
                {
                  userId: RegularUserId,
                  friendId: TestUserData[0]._id,
                },
                {
                  userId: TestUserData[0]._id,
                  friendId: RegularUserId,
                },
              ],
            }),
            FriendRequestModel.findOne({
              to: TestUserData[0]._id,
              from: RegularUserId,
            }),
          ]);

          expect(friendRelations).toHaveLength(2);
          expect(friendRequest).not.toBeNull();
          expect(friendRequest!.accepted).toBe(true);
        });
      } else {
        it('will not create a new friend relationship when the friend request is declined', async () => {
          const reason = 'You are a jerk.';
          await request(server)
            .post(
              acknowledgeRequestUrl(
                RegularUserData.username,
                TestUserData[0].username,
              ),
            )
            .set(...regularAuthHeader)
            .send({ accepted: false, reason })
            .expect(204);

          const [friendRelations, friendRequest] = await Promise.all([
            FriendModel.find({
              $or: [
                {
                  userId: RegularUserId,
                  friendId: TestUserData[0]._id,
                },
                {
                  userId: TestUserData[0]._id,
                  friendId: RegularUserId,
                },
              ],
            }),
            FriendRequestModel.findOne({
              to: TestUserData[0]._id,
              from: RegularUserId,
            }),
          ]);

          expect(friendRelations).toHaveLength(0);
          expect(friendRequest).not.toBeNull();
          expect(friendRequest!.accepted).toBe(false);
          expect(friendRequest!.reason).toBe(reason);
        });
      }
    });
  });
});
