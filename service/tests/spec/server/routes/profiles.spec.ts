import { Collection } from 'mongodb';
import { createMocks } from 'node-mocks-http';

import { Collections, UserDocument } from '../../../../src/data';
import { createTestLogger } from '../../../test-logger';
import {
  DefaultUser,
  DefaultUserManager,
  User,
  UserManager,
  UsersSortBy,
} from '../../../../src/users';
import { fakeProfile, fakeUser } from '../../../fixtures/fake-user';
import {
  getProfile,
  loadUserProfile,
  patchProfile,
  requireProfileWritePermission,
  searchProfiles,
  udpateProfile,
} from '../../../../src/server/routes/profiles';
import { mongoClient } from '../../../mongo-client';
import {
  ProfileVisibility,
  SortOrder,
  UserRole,
} from '../../../../src/constants';
import { MissingResourceError, ValidationError } from '../../../../src/errors';

const Log = createTestLogger('profiles-routes');

describe('Profiles Routes', () => {
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    Users = mongoClient.db().collection(Collections.Users);
  });

  it('Will return the profile for the selected user', () => {
    const userData = fakeUser();
    const user = new DefaultUser(mongoClient, Log, userData);

    const { req, res } = createMocks({
      log: Log,
      selectedUser: user,
    });
    getProfile(req, res);

    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      ...user.profile.toJSON(),
      memberSince: user.profile.memberSince.toISOString(),
    });
  });

  describe('Load User Profile Middleware', () => {
    let userManager: UserManager;

    beforeAll(() => {
      userManager = new DefaultUserManager(mongoClient, Log);
    });

    [
      { visibility: ProfileVisibility.Private, succeeds: false },
      { visibility: ProfileVisibility.FriendsOnly, succeeds: false },
      { visibility: ProfileVisibility.Public, succeeds: true },
    ].forEach((testCase) => {
      it(`Will ${
        testCase.succeeds ? 'load profile' : 'return MissingResourceError'
      } for anonymous users if requested profile has visibility: ${
        testCase.visibility
      }`, async () => {
        const expectedUser = new DefaultUser(
          mongoClient,
          Log,
          fakeUser({
            profile: fakeProfile({
              profileVisibility: testCase.visibility,
            }),
          }),
        );
        const { req, res } = createMocks({
          log: Log,
          params: { username: expectedUser.username },
          userManager,
        });
        const next = jest.fn();
        const getUser = jest
          .spyOn(userManager, 'getUserByUsernameOrEmail')
          .mockResolvedValue(expectedUser);

        await loadUserProfile(req, res, next);

        if (testCase.succeeds) {
          expect(getUser).toBeCalledWith(expectedUser.username);
          expect(next).toBeCalledWith();
          expect(res._isEndCalled()).toBe(false);
          expect(req.selectedUser).toEqual(expectedUser);
        } else {
          expect(next).toBeCalled();
          expect(next.mock.lastCall[0]).toBeInstanceOf(MissingResourceError);
          expect(res._isEndCalled()).toBe(false);
        }
      });
    });

    [
      {
        userData: fakeUser({ role: UserRole.User }),
        profileVisibility: ProfileVisibility.Private,
        friended: false,
        succeeds: false,
      },
      {
        userData: fakeUser({ role: UserRole.Admin }),
        profileVisibility: ProfileVisibility.Private,
        friended: false,
        succeeds: true,
      },
      {
        userData: fakeUser({ role: UserRole.User }),
        profileVisibility: ProfileVisibility.Private,
        friended: true,
        succeeds: false,
      },
      {
        userData: fakeUser({ role: UserRole.Admin }),
        profileVisibility: ProfileVisibility.Private,
        friended: true,
        succeeds: true,
      },
      {
        userData: fakeUser({ role: UserRole.User }),
        profileVisibility: ProfileVisibility.FriendsOnly,
        friended: false,
        succeeds: false,
      },
      {
        userData: fakeUser({ role: UserRole.Admin }),
        profileVisibility: ProfileVisibility.FriendsOnly,
        friended: false,
        succeeds: true,
      },
      {
        userData: fakeUser({ role: UserRole.User }),
        profileVisibility: ProfileVisibility.FriendsOnly,
        friended: true,
        succeeds: true,
      },
      {
        userData: fakeUser({ role: UserRole.Admin }),
        profileVisibility: ProfileVisibility.FriendsOnly,
        friended: true,
        succeeds: true,
      },
      {
        userData: fakeUser({ role: UserRole.User }),
        profileVisibility: ProfileVisibility.Public,
        friended: false,
        succeeds: true,
      },
      {
        userData: fakeUser({ role: UserRole.Admin }),
        profileVisibility: ProfileVisibility.Public,
        friended: false,
        succeeds: true,
      },
      {
        userData: fakeUser({ role: UserRole.User }),
        profileVisibility: ProfileVisibility.Public,
        friended: true,
        succeeds: true,
      },
      {
        userData: fakeUser({ role: UserRole.Admin }),
        profileVisibility: ProfileVisibility.Public,
        friended: true,
        succeeds: true,
      },
    ].forEach((testCase) => {
      it.skip(`Will ${
        testCase.succeeds ? 'load user' : 'return MissingResource error'
      } if current user has role ${testCase.userData.role} and is ${
        testCase.friended ? '' : 'not '
      } friended by target user with profile visibility: ${
        testCase.profileVisibility
      }`, async () => {
        const user = new DefaultUser(mongoClient, Log, testCase.userData);
        const expectedUser = new DefaultUser(
          mongoClient,
          Log,
          fakeUser({
            profile: fakeProfile({
              profileVisibility: testCase.profileVisibility,
            }),
            friends: testCase.friended ? [{ friendId: user.id }] : [],
          }),
        );
        const { req, res } = createMocks({
          log: Log,
          params: { username: expectedUser.username },
          user,
          userManager,
        });
        const next = jest.fn();
        const getUser = jest
          .spyOn(userManager, 'getUserByUsernameOrEmail')
          .mockResolvedValue(expectedUser);

        await loadUserProfile(req, res, next);

        if (testCase.succeeds) {
          expect(getUser).toBeCalledWith(expectedUser.username);
          expect(next).toBeCalledWith();
          expect(res._isEndCalled()).toBe(false);
          expect(req.selectedUser).toEqual(expectedUser);
        } else {
          expect(next).toBeCalled();
          expect(next.mock.lastCall[0]).toBeInstanceOf(MissingResourceError);
          expect(res._isEndCalled()).toBe(false);
        }
      });
    });

    it('Will allow users to request their own profiles', async () => {
      const userData = fakeUser({
        profile: {
          profileVisibility: ProfileVisibility.Private,
        },
      });
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        params: { username: user.username },
        user,
        userManager,
      });
      const next = jest.fn();
      const getUser = jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockResolvedValue(user);

      await loadUserProfile(req, res, next);

      expect(getUser).toBeCalledWith(user.username);
      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
      expect(req.selectedUser).toEqual(user);
    });

    it('Will return a MissingResource error if user is not found', async () => {
      const user = new DefaultUser(mongoClient, Log, fakeUser());
      const { req, res } = createMocks({
        log: Log,
        params: { username: 'username23' },
        user,
        userManager,
      });
      const next = jest.fn();
      jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockResolvedValue(undefined);

      await loadUserProfile(req, res, next);

      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(MissingResourceError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return a MissingResource error if the requested username does not pass validation', async () => {
      const { req, res } = createMocks({
        log: Log,
        params: { username: '@@*#)G(8jg03' },
        userManager,
      });
      const next = jest.fn();
      const getUser = jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockResolvedValue(undefined);

      await loadUserProfile(req, res, next);

      expect(getUser).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(MissingResourceError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return a ServerError if UserManager throws an exception', async () => {
      const error = new Error('Womp womp');
      const { req, res } = createMocks({
        log: Log,
        params: { username: 'username23' },
        userManager,
      });
      const next = jest.fn();
      jest
        .spyOn(userManager, 'getUserByUsernameOrEmail')
        .mockRejectedValue(error);

      await loadUserProfile(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Authorizing write operations', () => {
    let selectedUser: User;

    beforeEach(() => {
      selectedUser = new DefaultUser(
        mongoClient,
        Log,
        fakeUser({ role: UserRole.User }),
      );
    });

    it('Will not allow anonymous users to modify profile data', () => {
      const { req, res } = createMocks({
        log: Log,
        selectedUser,
      });
      const next = jest.fn();
      requireProfileWritePermission(req, res, next);
      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(MissingResourceError);
      expect(res._isEndCalled()).toBe(false);
    });

    it("Will not allow regular users to modify other users' profiles", () => {
      const user = new DefaultUser(
        mongoClient,
        Log,
        fakeUser({ role: UserRole.User }),
      );
      const { req, res } = createMocks({
        log: Log,
        selectedUser,
        user,
      });
      const next = jest.fn();
      requireProfileWritePermission(req, res, next);
      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(MissingResourceError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will allow regular users to modify their own profiles', () => {
      const { req, res } = createMocks({
        log: Log,
        selectedUser,
        user: selectedUser,
      });
      const next = jest.fn();
      requireProfileWritePermission(req, res, next);
      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
    });

    it("Will allow admins to modify other users' profiles", () => {
      const user = new DefaultUser(
        mongoClient,
        Log,
        fakeUser({ role: UserRole.Admin }),
      );
      const { req, res } = createMocks({
        log: Log,
        selectedUser,
        user,
      });
      const next = jest.fn();
      requireProfileWritePermission(req, res, next);
      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will allow admins to modify their own profiles', () => {
      const user = new DefaultUser(
        mongoClient,
        Log,
        fakeUser({ role: UserRole.Admin }),
      );
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        user,
      });
      const next = jest.fn();
      requireProfileWritePermission(req, res, next);
      expect(next).toBeCalledWith();
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Updating Profiles', () => {
    it('Will update a profile', async () => {
      const userData = fakeUser();
      const newProfileData = fakeProfile({
        customData: {
          meetingTime: 'soon',
        },
      });
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: newProfileData,
      });
      const next = jest.fn();
      await Users.insertOne(userData);

      await udpateProfile(req, res, next);

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.profile).toEqual(newProfileData);
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        ...user.profile.toJSON(),
        memberSince: user.memberSince.toISOString(),
      });
    });

    it('Will clear updated profile fields if they are undefined in the update request', async () => {
      const userData = fakeUser();
      const newProfileData = {
        profileVisibility: ProfileVisibility.Private,
      };
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: newProfileData,
      });
      const next = jest.fn();
      await Users.insertOne(userData);

      await udpateProfile(req, res, next);

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.profile).toEqual(newProfileData);
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        memberSince: user.memberSince.toISOString(),
        profileVisibility: user.profile.profileVisibility,
        userId: user.id,
        username: user.username,
      });
    });

    it('Will clear updated profile fields if they are null in the update request', async () => {
      const userData = fakeUser();
      const newProfileData = {
        profileVisibility: ProfileVisibility.Private,
      };
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: {
          ...newProfileData,
          avatar: null,
          bio: null,
          birthdate: null,
          certifications: null,
          customData: null,
          experienceLevel: null,
          location: null,
          name: null,
          startedDiving: null,
        },
      });
      const next = jest.fn();
      await Users.insertOne(userData);

      await udpateProfile(req, res, next);

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.profile).toEqual(newProfileData);
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        memberSince: user.memberSince.toISOString(),
        profileVisibility: user.profile.profileVisibility,
        userId: user.id,
        username: user.username,
      });
    });

    it('Will throw a ValidationError if the request body fails validation when updating a profile', async () => {
      const userData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: {
          profileVisibility: ProfileVisibility.Public,
          startedDiving: 'yesterday',
        },
      });
      const next = jest.fn();
      const save = jest.spyOn(user.profile, 'save').mockResolvedValue();

      await udpateProfile(req, res, next);

      expect(save).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will return a server error if the user class throws an exception', async () => {
      const error = new Error('MongoDb is not working');
      const userData = fakeUser();
      const newProfileData = fakeProfile();
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: newProfileData,
      });
      const next = jest.fn();
      jest.spyOn(user.profile, 'save').mockRejectedValue(error);

      await udpateProfile(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Patching Profiles', () => {
    it('Will patch a profile', async () => {
      const userData = fakeUser();
      const newProfileData = fakeProfile({
        customData: {
          meetingTime: 'soon',
        },
      });
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: newProfileData,
      });
      const next = jest.fn();
      await Users.insertOne(userData);

      await patchProfile(req, res, next);

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.profile).toEqual(newProfileData);
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        ...user.profile.toJSON(),
        memberSince: user.memberSince.toISOString(),
      });
    });

    it('Will not patch profile fields if they are undefined in the request body', async () => {
      const userData = fakeUser({
        profile: fakeProfile({
          customData: { boo: true },
        }),
      });
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: {},
      });
      const next = jest.fn();
      await Users.insertOne(userData);

      await patchProfile(req, res, next);

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.profile).toEqual(userData.profile);
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        ...user.profile.toJSON(),
        memberSince: user.memberSince.toISOString(),
      });
    });

    it('Will clear patched profile fields if they are null in the request body', async () => {
      const userData = fakeUser();
      const newProfileData = {
        profileVisibility: ProfileVisibility.Private,
      };
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: {
          ...newProfileData,
          avatar: null,
          bio: null,
          birthdate: null,
          certifications: null,
          customData: null,
          experienceLevel: null,
          location: null,
          name: null,
          startedDiving: null,
        },
      });
      const next = jest.fn();
      await Users.insertOne(userData);

      await patchProfile(req, res, next);

      const result = await Users.findOne({ _id: userData._id });
      expect(result?.profile).toEqual(newProfileData);
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        memberSince: user.memberSince.toISOString(),
        profileVisibility: user.profile.profileVisibility,
        userId: user.id,
        username: user.username,
      });
    });

    it('Will throw a ValidationError if request body fails validation in the patch request', async () => {
      const userData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: {
          profileVisibility: ProfileVisibility.Public,
          startedDiving: 'yesterday',
        },
      });
      const next = jest.fn();
      const save = jest.spyOn(user.profile, 'save').mockResolvedValue();

      await patchProfile(req, res, next);

      expect(save).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will throw a server error if the user class throws an exception', async () => {
      const error = new Error('MongoDb is not working');
      const userData = fakeUser();
      const newProfileData = fakeProfile();
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        selectedUser: user,
        body: newProfileData,
      });
      const next = jest.fn();
      jest.spyOn(user.profile, 'save').mockRejectedValue(error);

      await patchProfile(req, res, next);

      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });
  });

  describe('Searching For Profiles', () => {
    let userManager: UserManager;

    beforeEach(() => {
      userManager = new DefaultUserManager(mongoClient, Log);
    });

    it('Will return results matching the search', async () => {
      const userData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);
      const query = {
        query: 'smith',
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
        skip: 150,
        limit: 50,
      };
      const { req, res } = createMocks({
        log: Log,
        user,
        query,
        userManager,
      });
      const expected = [fakeUser(), fakeUser(), fakeUser()].map(
        (data) => new DefaultUser(mongoClient, Log, data),
      );
      const search = jest
        .spyOn(userManager, 'searchUsers')
        .mockResolvedValue(expected);
      const next = jest.fn();

      await searchProfiles(req, res, next);

      expect(search).toBeCalledWith({
        ...query,
        profileVisibleTo: user.id,
      });
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(
        expected.map((user) => ({
          ...user.profile.toJSON(),
          memberSince: user.memberSince.toISOString(),
        })),
      );
    });

    it('Will search all public profiles if user is anonymous', async () => {
      const query = {
        query: 'smith',
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
        skip: 150,
        limit: 50,
      };
      const { req, res } = createMocks({
        log: Log,
        query,
        userManager,
      });
      const expected = [fakeUser(), fakeUser(), fakeUser()].map(
        (data) => new DefaultUser(mongoClient, Log, data),
      );
      const search = jest
        .spyOn(userManager, 'searchUsers')
        .mockResolvedValue(expected);
      const next = jest.fn();

      await searchProfiles(req, res, next);

      expect(search).toBeCalledWith({
        ...query,
        profileVisibleTo: 'public',
      });
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(
        expected.map((user) => ({
          ...user.profile.toJSON(),
          memberSince: user.memberSince.toISOString(),
        })),
      );
    });

    it('Will search all profiles if user is an admin', async () => {
      const userData = fakeUser({ role: UserRole.Admin });
      const user = new DefaultUser(mongoClient, Log, userData);
      const query = {
        query: 'smith',
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
        skip: 150,
        limit: 50,
      };
      const { req, res } = createMocks({
        log: Log,
        user,
        query,
        userManager,
      });
      const expected = [fakeUser(), fakeUser(), fakeUser()].map(
        (data) => new DefaultUser(mongoClient, Log, data),
      );
      const search = jest
        .spyOn(userManager, 'searchUsers')
        .mockResolvedValue(expected);
      const next = jest.fn();

      await searchProfiles(req, res, next);

      expect(search).toBeCalledWith(query);
      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(
        expected.map((user) => ({
          ...user.profile.toJSON(),
          memberSince: user.memberSince.toISOString(),
        })),
      );
    });

    it('Will throw a validation error if the query string is invalid', async () => {
      const userData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);
      const query = {
        query: 'smith',
        sortBy: 'birthdate',
        sortOrder: SortOrder.Ascending,
        skip: -150,
        limit: 50,
      };
      const { req, res } = createMocks({
        log: Log,
        user,
        query,
        userManager,
      });
      const next = jest.fn();

      await searchProfiles(req, res, next);

      expect(next).toBeCalled();
      expect(next.mock.lastCall[0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will throw a server error if the User Manager throws an exception', async () => {
      const error = new Error("Hello. I 'splode!");
      const query = {
        query: 'smith',
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
        skip: 150,
        limit: 50,
      };
      const { req, res } = createMocks({
        log: Log,
        query,
        userManager,
      });
      const search = jest
        .spyOn(userManager, 'searchUsers')
        .mockRejectedValue(error);
      const next = jest.fn();

      await searchProfiles(req, res, next);

      expect(search).toBeCalledWith({
        ...query,
        profileVisibleTo: 'public',
      });
      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalledWith(error);
    });
  });
});
