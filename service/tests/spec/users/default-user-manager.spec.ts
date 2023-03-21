/* eslint-disable no-process-env */
import { faker } from '@faker-js/faker';
import { compare } from 'bcrypt';
import { Collection } from 'mongodb';
import { ProfileVisibility, SortOrder, UserRole } from '../../../src/constants';
import { Collections, UserDocument } from '../../../src/data';
import { ConflictError, ValidationError } from '../../../src/errors';
import { CreateUserOptions, User, UsersSortBy } from '../../../src/users';
import { DefaultUser } from '../../../src/users/default-user';
import { DefaultUserManager } from '../../../src/users/default-user-manager';
import { fakePassword, fakeProfile, fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { createTestLogger } from '../../test-logger';

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
      const profileVisibility = ProfileVisibility.Public;
      const userManager = new DefaultUserManager(mongoClient, Log);
      const user = await userManager.createUser({
        username,
        email,
        password,
        profileVisibility,
      });

      expect(user.email).toEqual(email);
      expect(user.emailVerified).toBe(false);
      expect(user.hasPassword).toBe(true);
      expect(user.id.length).toBeGreaterThan(1);
      expect(user.isLockedOut).toBe(false);
      expect(user.memberSince.valueOf()).toBeCloseTo(new Date().valueOf(), -2);
      expect(user.role).toEqual(UserRole.User);
      expect(user.username).toEqual(username);
      expect(user.profile.profileVisibility).toEqual(profileVisibility);

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
        profile: {
          profileVisibility,
        },
      });
      await expect(compare(password, passwordHash!)).resolves.toBe(true);
    });

    const invalidOptions: Record<string, CreateUserOptions> = {
      'Will throw ValidationError if username is invalid': {
        username: 'nope! Not VAlID###',
      },
      'Will throw ValidationError if email address is invalid': {
        username: 'jimmy_33',
        email: 'NOT_AN EMAIL!',
      },
      'Will throw ValidationError if password does not meet strength requirments':
        { username: 'ralph27', password: 'too weak' },
    };
    Object.keys(invalidOptions).forEach((key) => {
      it(key, async () => {
        const userManager = new DefaultUserManager(mongoClient, Log);
        await expect(
          userManager.createUser(invalidOptions[key]),
        ).rejects.toThrowError(ValidationError);
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
    let testUsers: User[];

    beforeEach(async () => {
      const testUsersData = new Array<UserDocument>(50);
      for (let i = 0; i < testUsersData.length; i++) {
        testUsersData[i] = fakeUser({
          // Mongo DB handles sorting differently than Node.js when it comes to underscores.
          // This fix prevents flaky test results...
          username: faker.internet.userName().replace('_', '.'),

          role: faker.helpers.arrayElement([UserRole.User, UserRole.Admin]),
        });
      }
      await Users.insertMany(testUsersData);
      testUsers = testUsersData.map(
        (data) => new DefaultUser(mongoClient, Log, data),
      );
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
        query: testUsers[3].username,
      });
      expect(users).toEqual([testUsers[3]]);
    });

    it('Will limit "page" size', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      const users = await userManager.searchUsers({
        limit: 7,
        sortBy: UsersSortBy.Username,
      });
      expect(users).toHaveLength(7);
      expect(users).toEqual(
        testUsers
          .sort((a, b) => a.username.localeCompare(b.username))
          .slice(0, 7),
      );
    });

    it('Will allow showing results beyond the first page', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      const users = await userManager.searchUsers({
        skip: 7,
        limit: 7,
        sortBy: UsersSortBy.Username,
      });
      expect(users).toHaveLength(7);
      expect(users).toEqual(
        testUsers
          .sort((a, b) => a.username.localeCompare(b.username))
          .slice(7, 14),
      );
    });

    [UsersSortBy.MemberSince, UsersSortBy.Username].forEach((sortBy) => {
      it(`Will return results sorted by ${sortBy} in ascending order`, async () => {
        const userManager = new DefaultUserManager(mongoClient, Log);
        const comparators: Record<string, (a: User, b: User) => number> = {
          [UsersSortBy.MemberSince]: (a, b) =>
            a.memberSince.valueOf() - b.memberSince.valueOf(),
          [UsersSortBy.Username]: (a, b) =>
            a.username.localeCompare(b.username),
          [UsersSortBy.Relevance]: () => 0,
        };

        const users = await userManager.searchUsers({
          sortBy,
          sortOrder: SortOrder.Ascending,
        });

        expect(users).toEqual(testUsers.sort(comparators[sortBy]));
      });

      it(`Will return results sorted by ${sortBy} in descending order`, async () => {
        const userManager = new DefaultUserManager(mongoClient, Log);
        const comparators: Record<string, (a: User, b: User) => number> = {
          [UsersSortBy.MemberSince]: (a, b) =>
            b.memberSince.valueOf() - a.memberSince.valueOf(),
          [UsersSortBy.Username]: (a, b) =>
            b.username.localeCompare(a.username),
          [UsersSortBy.Relevance]: () => 0,
        };

        const users = await userManager.searchUsers({
          sortBy,
          sortOrder: SortOrder.Descending,
        });

        expect(users).toEqual(testUsers.sort(comparators[sortBy]));
      });
    });

    [UserRole.User, UserRole.Admin].forEach((role) => {
      it(`Will filter by role: ${role}`, async () => {
        const userManager = new DefaultUserManager(mongoClient, Log);
        const expected = testUsers.filter((user) => user.role === role);
        const actual = await userManager.searchUsers({ role });
        expect(actual).toEqual(expected);
      });
    });

    it('Will throw a ValidationError if the query fails validation', async () => {
      const userManager = new DefaultUserManager(mongoClient, Log);
      await expect(
        userManager.searchUsers({ sortBy: 'zodiacSign', skip: -50 }),
      ).rejects.toThrowError(ValidationError);
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
        friends: [{ friendId: userData._id }],
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
        .map((data) => new DefaultUser(mongoClient, Log, data));

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
        let visibility: string;

        if (i < 4) {
          visibility = ProfileVisibility.Public;
        } else if (i < 8) {
          visibility = ProfileVisibility.FriendsOnly;
        } else {
          visibility = ProfileVisibility.Private;
        }

        userData[i] = fakeUser({
          profile: fakeProfile({ profileVisibility: visibility }),
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
