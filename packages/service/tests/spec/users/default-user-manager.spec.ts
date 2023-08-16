/* eslint-disable no-process-env */
import { faker } from '@faker-js/faker';
import { compare } from 'bcrypt';
import { Collection } from 'mongodb';
import { ProfileVisibility, SortOrder, UserRole } from '../../../src/constants';
import { Collections, UserDocument, UserSchema } from '../../../src/data';
import { ConflictError, ValidationError } from '../../../src/errors';
import { UsersSortBy } from '../../../src/users';
import { DefaultUser } from '../../../src/users/default-user';
import { DefaultUserManager } from '../../../src/users/default-user-manager';
import { fakePassword, fakeProfile, fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { createTestLogger } from '../../test-logger';

import UserSearchData from '../../fixtures/user-search-data.json';

const Log = createTestLogger('default-user-manager');

describe('Default User Manager', () => {
  let oldEnv: object;
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    Users = mongoClient.db().collection(Collections.Users);
    oldEnv = Object.assign({}, process.env);
    process.env.BT_PASSWORD_SALT_ROUNDS = '1';
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  describe('Retrieving Users', () => {
    it('Will retrieve a user by id', async () => {
      const data = fakeUser();
      const expected = new DefaultUser(mongoClient, Log, data);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const actual = await userManager.getUser(expected.id);
      expect(actual).toEqual(expected);
    });

    it('Will retrieve a user by username', async () => {
      const data = fakeUser();
      const expected = new DefaultUser(mongoClient, Log, data);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const actual = await userManager.getUserByUsernameOrEmail(
        expected.username.toUpperCase(),
      );
      expect(actual).toEqual(expected);
    });

    it('Will retrieve a user by email', async () => {
      const data = fakeUser();
      const expected = new DefaultUser(mongoClient, Log, data);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const actual = await userManager.getUserByUsernameOrEmail(
        expected.email!.toUpperCase(),
      );
      expect(actual).toEqual(expected);
    });

    it('Will return undefined if id is not found', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      await expect(
        userManager.getUser(faker.datatype.uuid()),
      ).resolves.toBeUndefined();
    });

    it('Will return undefined if id is not valid', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      await expect(userManager.getUser('blah!')).resolves.toBeUndefined();
    });

    it('Will return undefined if username or email is not found', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      await expect(
        userManager.getUserByUsernameOrEmail(faker.internet.userName()),
      ).resolves.toBeUndefined();
    });
  });

  describe('Authenticating Users', () => {
    it('Will return a user if username and password match', async () => {
      const password = fakePassword();
      const data = fakeUser({}, password);
      const expected = new DefaultUser(mongoClient, Log, data);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const actual = await userManager.authenticateUser(
        expected.username.toUpperCase(),
        password,
      );
      data.lastLogin = actual?.lastLogin;
      expect(actual).toEqual(expected);
    });

    it('Will return a user if email and password match', async () => {
      const password = fakePassword();
      const data = fakeUser({}, password);
      const expected = new DefaultUser(mongoClient, Log, data);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const actual = await userManager.authenticateUser(
        expected.email!.toUpperCase(),
        password,
      );
      data.lastLogin = actual?.lastLogin;
      expect(actual).toEqual(expected);
    });

    it('Will return undefined if username or email are not found', async () => {
      const password = fakePassword();
      const data = fakeUser({}, password);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const user = await userManager.authenticateUser('no_such_user', password);
      expect(user).toBeUndefined();
    });

    it('Will return undefined if password is incorrect', async () => {
      const password = fakePassword();
      const data = fakeUser({}, password);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const user = await userManager.authenticateUser(data.username, 'nope123');
      expect(user).toBeUndefined();
    });

    it('Will return undefined if account has no password set', async () => {
      const password = fakePassword();
      const data = fakeUser({}, null);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const user = await userManager.authenticateUser(data.username, password);
      expect(user).toBeUndefined();
    });

    it('Will return undefined if account is currently locked', async () => {
      const password = fakePassword();
      const data = fakeUser({ isLockedOut: true }, password);
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(data);
      const user = await userManager.authenticateUser(data.username, password);
      expect(user).toBeUndefined();
    });
  });

  describe('Create New User', () => {
    it('Will create a new user with minimal options', async () => {
      const username = faker.internet.userName();
      const usernameLowered = username.toLowerCase();
      const userManager = new DefaultUserManager(mongoClient, Log);
      const user = await userManager.createUser({ username });

      expect(user.email).toBeUndefined();
      expect(user.emailVerified).toBe(false);
      expect(user.hasPassword).toBe(false);
      expect(user.id.length).toBeGreaterThan(1);
      expect(user.isLockedOut).toBe(false);
      expect(user.memberSince.valueOf()).toBeCloseTo(new Date().valueOf(), -2);
      expect(user.role).toEqual(UserRole.User);
      expect(user.username).toEqual(username);
      expect(user.profile.profileVisibility).toEqual(
        ProfileVisibility.FriendsOnly,
      );

      const result = await Users.findOne({
        usernameLowered: username.toLocaleLowerCase(),
      });
      expect(result).toBeDefined();
      expect(result).toEqual({
        _id: user.id,
        emailVerified: false,
        isLockedOut: false,
        memberSince: user.memberSince,
        role: UserRole.User,
        username,
        usernameLowered,
      });
    });

    it('Will create a new user with all options set', async () => {
      const username = faker.internet.userName();
      const usernameLowered = username.toLowerCase();
      const email = faker.internet.email();
      const emailLowered = email.toLowerCase();
      const password = fakePassword();
      const profileData = fakeProfile();
      const userManager = new DefaultUserManager(mongoClient, Log);
      const user = await userManager.createUser({
        username,
        email,
        password,
        profile: profileData,
      });

      expect(user.email).toEqual(email);
      expect(user.emailVerified).toBe(false);
      expect(user.hasPassword).toBe(true);
      expect(user.id.length).toBeGreaterThan(1);
      expect(user.isLockedOut).toBe(false);
      expect(user.memberSince.valueOf()).toBeCloseTo(new Date().valueOf(), -2);
      expect(user.role).toEqual(UserRole.User);
      expect(user.username).toEqual(username);

      expect(user.profile.avatar).toEqual(profileData.avatar);
      expect(user.profile.bio).toEqual(profileData.bio);
      expect(user.profile.birthdate).toEqual(profileData.birthdate);
      expect(user.profile.certifications).toEqual(profileData.certifications);
      expect(user.profile.experienceLevel).toEqual(profileData.experienceLevel);
      expect(user.profile.location).toEqual(profileData.location);
      expect(user.profile.profileVisibility).toEqual(
        profileData.profileVisibility,
      );
      expect(user.profile.startedDiving).toEqual(profileData.startedDiving);

      const result = await Users.findOne({
        usernameLowered: username.toLocaleLowerCase(),
      });
      const passwordHash = result?.passwordHash;
      expect(result).toBeDefined();
      expect(passwordHash).toBeDefined();

      delete result?.passwordHash;
      expect(result).toEqual({
        _id: user.id,
        email,
        emailLowered,
        emailVerified: false,
        isLockedOut: false,
        memberSince: user.memberSince,
        role: UserRole.User,
        username,
        usernameLowered,
        profile: profileData,
      });
      await expect(compare(password, passwordHash!)).resolves.toBe(true);
    });

    [
      {
        name: 'invalid username',
        options: {
          username: 'nope! Not VAlID###',
        },
      },
      {
        name: 'invalid email address',
        options: {
          username: 'jimmy_33',
          email: 'NOT_AN EMAIL!',
        },
      },
      {
        name: 'weak password',
        options: { username: 'ralph27', password: 'too weak' },
      },
    ].forEach((testCase) => {
      it(`Will throw a ValidationError if the options fail validation: ${testCase.name}`, async () => {
        const userManager = new DefaultUserManager(mongoClient, Log);
        await expect(
          userManager.createUser(testCase.options),
        ).rejects.toThrowErrorMatchingSnapshot();
      });
    });

    it('Will throw a ConflictError if email is already taken', async () => {
      const existingUser = fakeUser();
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(existingUser);

      await expect(
        userManager.createUser({
          username: faker.internet.userName(),
          email: existingUser.email?.toUpperCase(),
        }),
      ).rejects.toThrowError(ConflictError);
    });

    it('Will throw a ConflictError if username is already taken', async () => {
      const existingUser = fakeUser();
      const userManager = new DefaultUserManager(mongoClient, Log);
      await Users.insertOne(existingUser);

      await expect(
        userManager.createUser({
          username: existingUser.username.toUpperCase(),
          email: faker.internet.email(),
        }),
      ).rejects.toThrowError(ConflictError);
    });
  });

  describe('Searching For Users', () => {
    let testUsersData: UserDocument[];

    beforeAll(() => {
      testUsersData = UserSearchData.map((user) => UserSchema.parse(user));
    });

    beforeEach(async () => {
      await Users.insertMany(testUsersData);
    });

    it('Will return an empty array if no results match', async () => {
      await Users.deleteMany({});
      const userManager = new DefaultUserManager(mongoClient, Log);
      const users = await userManager.searchUsers();
      expect(users).toEqual([]);
    });

    it('Will perform text based searches', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      const users = await userManager.searchUsers({
        query: 'Walker',
      });
      expect(users).toMatchSnapshot();
    });

    it('Will limit "page" size', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      const users = await userManager.searchUsers({
        limit: 7,
        sortBy: UsersSortBy.Username,
      });
      expect(users).toHaveLength(7);
      expect(users).toMatchSnapshot();
    });

    it('Will allow showing results beyond the first page', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      const users = await userManager.searchUsers({
        skip: 7,
        limit: 7,
        sortBy: UsersSortBy.Username,
      });
      expect(users).toHaveLength(7);
      expect(users).toMatchSnapshot();
    });

    [
      { sortBy: UsersSortBy.MemberSince, sortOrder: SortOrder.Ascending },
      { sortBy: UsersSortBy.MemberSince, sortOrder: SortOrder.Descending },
      { sortBy: UsersSortBy.Username, sortOrder: SortOrder.Ascending },
      { sortBy: UsersSortBy.Username, sortOrder: SortOrder.Descending },
    ].forEach(({ sortBy, sortOrder }) => {
      it(`Will return results sorted by ${sortBy} in ${sortOrder} order`, async () => {
        const userManager = new DefaultUserManager(mongoClient, Log);
        const users = await userManager.searchUsers({
          sortBy,
          sortOrder,
          limit: 10,
        });
        expect(users).toMatchSnapshot();
      });
    });

    [UserRole.User, UserRole.Admin].forEach((role) => {
      it(`Will filter by role: ${role}`, async () => {
        const userManager = new DefaultUserManager(mongoClient, Log);
        const results = await userManager.searchUsers({ role, limit: 10 });
        expect(results).toMatchSnapshot();
      });
    });

    it('Will throw a ValidationError if the query fails validation', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      await expect(userManager.searchUsers({ skip: -50 })).rejects.toThrowError(
        ValidationError,
      );
    });
  });

  describe('Searching Profiles', () => {
    it('Will return public profiles and profiles belonging to friends when "profilesVisibleTo" parameter is a user Id', async () => {
      const userData = fakeUser({
        profile: fakeProfile({
          profileVisibility: ProfileVisibility.Public,
        }),
      });

      const publicUserData = fakeUser({
        profile: fakeProfile({
          profileVisibility: ProfileVisibility.Public,
        }),
      });

      const privateUserData = fakeUser({
        profile: fakeProfile({
          profileVisibility: ProfileVisibility.Private,
        }),
      });

      const friendsOnlyWithFriendUserData = fakeUser({
        profile: fakeProfile({
          profileVisibility: ProfileVisibility.FriendsOnly,
        }),
        friends: [{ friendId: userData._id, friendsSince: new Date() }],
      });

      const friendsOnlyWithoutFriendUserData = fakeUser({
        profile: fakeProfile({
          profileVisibility: ProfileVisibility.FriendsOnly,
        }),
      });

      await Users.insertMany([
        userData,
        privateUserData,
        publicUserData,
        friendsOnlyWithFriendUserData,
        friendsOnlyWithoutFriendUserData,
      ]);
      const userManager = new DefaultUserManager(mongoClient, Log);

      const expected = [publicUserData, friendsOnlyWithFriendUserData]
        .sort((a, b) => b.memberSince.valueOf() - a.memberSince.valueOf())
        .map((data) => {
          delete data.friends;
          return new DefaultUser(mongoClient, Log, data);
        });

      const actual = await userManager.searchUsers({
        profileVisibleTo: userData._id,
        sortBy: UsersSortBy.MemberSince,
        sortOrder: SortOrder.Descending,
      });

      expect(actual).toHaveLength(expected.length);
      expect(actual).toEqual(expected);
    });

    it('Will return all public profiles when profileVisibleTo is set to "public"', async () => {
      const userData = new Array<UserDocument>(12);
      for (let i = 0; i < userData.length; i++) {
        let profileVisibility: ProfileVisibility;

        if (i < 4) {
          profileVisibility = ProfileVisibility.Public;
        } else if (i < 8) {
          profileVisibility = ProfileVisibility.FriendsOnly;
        } else {
          profileVisibility = ProfileVisibility.Private;
        }

        userData[i] = fakeUser({
          profile: fakeProfile({ profileVisibility }),
        });
      }
      await Users.insertMany([...userData]);
      const userManager = new DefaultUserManager(mongoClient, Log);
      const expected = userData
        .slice(0, 4)
        .sort((a, b) => b.memberSince.valueOf() - a.memberSince.valueOf())
        .map((data) => new DefaultUser(mongoClient, Log, data));

      const actual = await userManager.searchUsers({
        profileVisibleTo: 'public',
        sortBy: UsersSortBy.MemberSince,
        sortOrder: SortOrder.Descending,
      });

      expect(actual).toEqual(expected);
    });
  });
});
