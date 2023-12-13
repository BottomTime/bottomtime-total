import { UsersService } from '../../../src/users/users.service';
import { createTestUser } from '../../utils';

import { UserData, UserDocument, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';
import {
  CreateUserOptions,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';
import * as uuid from 'uuid';
import bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';

import SearchData from '../../fixtures/users.json';

const TestUserData: Partial<UserData> = {
  _id: '4E64038D-0ABF-4C1A-B678-55F8AFCB6B2D',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
};

jest.mock('uuid');
jest.mock('bcrypt');

describe('Users Service', () => {
  let service: UsersService;

  beforeAll(() => {
    service = new UsersService(UserModel);
  });

  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2023-10-02T10:23:02.003Z'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
    jest
      .spyOn(uuid, 'v4')
      .mockReturnValue('0EE2C4FF-1013-45DF-9F13-E45ED2DB9555');
    jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValue('<<HASHED PASSWORD>>' as never);
  });

  describe('when retrieving users', () => {
    it('will retrieve a user by id', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(UserModel, userDocument);

      await userDocument.save();
      const actual = await service.getUserById(userDocument._id);

      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will retrieve a user by username', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(UserModel, userDocument);

      await userDocument.save();
      const actual = await service.getUserByUsernameOrEmail(
        userDocument.username.toUpperCase(),
      );

      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will retrieve a user by email', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(UserModel, userDocument);

      await userDocument.save();
      const actual = await service.getUserByUsernameOrEmail(
        expected.email!.toUpperCase(),
      );
      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will return undefined if id is not found', async () => {
      const result = await service.getUserById('foo');
      expect(result).toBeUndefined();
    });

    it('will return undefined if username or email is not found', async () => {
      const result = await service.getUserByUsernameOrEmail(
        'tom_morello@gmail.com',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('when creating new user accounts', () => {
    it('will create new users with minimal options', async () => {
      const options: CreateUserOptions = {
        username: 'Roger69_83',
      };
      const user = await service.createUser(options);

      expect(user.toJSON()).toMatchSnapshot();

      const data = await UserModel.findById(user.id);
      expect(data).toMatchSnapshot();
    });

    it('will create a new user with all options set', async () => {
      const options: CreateUserOptions = {
        username: 'Tyler.Durden',
        email: 'rule1@diveclub.ca',
        password: '(*H()@*&BNINFPOI()$*9ij90',
        role: UserRole.User,
        profile: {
          avatar: 'https://gravatar.com/Tyler.Durden',
          bio: "I don't talk about my dive clug",
          birthdate: '1987-02-12',
          certifications: [
            { course: 'Open water', agency: 'SSI' },
            { course: 'Stress and Rescue', agency: 'SSI', date: '2018' },
          ],
          customData: {},
          experienceLevel: 'Experienced',
          location: 'Vancouver, BC',
          name: 'Tyler Durden, Esq.',
          startedDiving: '2011',
        },
      };

      const user = await service.createUser(options);

      expect(user.toJSON()).toMatchSnapshot();

      const data = await UserModel.findById(user.id);
      expect(data).toMatchSnapshot();
    });

    it('Will throw a ConflictError if email is already taken', async () => {
      const email = 'testemail@email.org';
      const existingUser = createTestUser({
        email,
        emailLowered: email.toLowerCase(),
      });
      const options: CreateUserOptions = {
        username: 'Roger69_83',
        email,
      };
      await existingUser.save();

      await expect(service.createUser(options)).rejects.toThrowError(
        ConflictException,
      );
    });

    it('Will throw a ConflictError if username is already taken', async () => {
      const username = 'BestUsernameEver';
      const existingUser = createTestUser({
        username,
        usernameLowered: username.toLowerCase(),
      });
      const options: CreateUserOptions = {
        username,
      };
      await existingUser.save();

      await expect(service.createUser(options)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('when searching profiles', () => {
    let userDocuments: UserDocument[];

    beforeAll(async () => {
      userDocuments = SearchData.map((user) => new UserModel(user));
    });

    beforeEach(async () => {
      await UserModel.insertMany(userDocuments);
    });

    it('will return an empty array if no results match', async () => {
      await UserModel.deleteMany({});
      await expect(service.searchUsers()).resolves.toEqual([]);
    });

    it('will perform text based searches', async () => {
      await expect(
        service.searchUsers({ query: 'Mount' }),
      ).resolves.toMatchSnapshot();
    });

    it('will limit "page" size', async () => {
      const results = await service.searchUsers({ limit: 7 });
      expect(results).toHaveLength(7);
      expect(results).toMatchSnapshot();
    });

    it('will allow showing results beyond the first page', async () => {
      const results = await service.searchUsers({ limit: 7, skip: 7 });
      expect(results).toHaveLength(7);
      expect(results).toMatchSnapshot();
    });

    [
      { sortBy: UsersSortBy.MemberSince, sortOrder: SortOrder.Ascending },
      { sortBy: UsersSortBy.MemberSince, sortOrder: SortOrder.Descending },
      { sortBy: UsersSortBy.Username, sortOrder: SortOrder.Ascending },
      { sortBy: UsersSortBy.Username, sortOrder: SortOrder.Descending },
    ].forEach(({ sortBy, sortOrder }) => {
      it(`Will return results sorted by ${sortBy} in ${sortOrder} order`, async () => {
        await expect(
          service.searchUsers({ sortBy, sortOrder, limit: 5 }),
        ).resolves.toMatchSnapshot();
      });
    });

    [UserRole.User, UserRole.Admin].forEach((role) => {
      it(`Will filter by role: ${role}`, async () => {
        await expect(
          service.searchUsers({ role, limit: 10 }),
        ).resolves.toMatchSnapshot();
      });
    });

    // it('Will return public profiles and profiles belonging to friends when "profilesVisibleTo" parameter is a user Id', async () => {
    //   const userData = fakeUser({
    //     profile: fakeProfile({
    //       profileVisibility: ProfileVisibility.Public,
    //     }),
    //   });
    //   const publicUserData = fakeUser({
    //     profile: fakeProfile({
    //       profileVisibility: ProfileVisibility.Public,
    //     }),
    //   });
    //   const privateUserData = fakeUser({
    //     profile: fakeProfile({
    //       profileVisibility: ProfileVisibility.Private,
    //     }),
    //   });
    //   const friendsOnlyWithFriendUserData = fakeUser({
    //     profile: fakeProfile({
    //       profileVisibility: ProfileVisibility.FriendsOnly,
    //     }),
    //     friends: [{ friendId: userData._id, friendsSince: new Date() }],
    //   });
    //   const friendsOnlyWithoutFriendUserData = fakeUser({
    //     profile: fakeProfile({
    //       profileVisibility: ProfileVisibility.FriendsOnly,
    //     }),
    //   });
    //   await Users.insertMany([
    //     userData,
    //     privateUserData,
    //     publicUserData,
    //     friendsOnlyWithFriendUserData,
    //     friendsOnlyWithoutFriendUserData,
    //   ]);
    //   const userManager = new DefaultUserManager(mongoClient, Log);
    //   const expected = [publicUserData, friendsOnlyWithFriendUserData]
    //     .sort((a, b) => b.memberSince.valueOf() - a.memberSince.valueOf())
    //     .map((data) => {
    //       delete data.friends;
    //       return new DefaultUser(mongoClient, Log, data);
    //     });
    //   const actual = await userManager.searchUsers({
    //     profileVisibleTo: userData._id,
    //     sortBy: UsersSortBy.MemberSince,
    //     sortOrder: SortOrder.Descending,
    //   });
    //   expect(actual).toHaveLength(expected.length);
    //   expect(actual).toEqual(expected);
    // });

    // it('Will return all public profiles when profileVisibleTo is set to "public"', async () => {
    //   const userData = new Array<UserDocument>(12);
    //   for (let i = 0; i < userData.length; i++) {
    //     let profileVisibility: ProfileVisibility;
    //     if (i < 4) {
    //       profileVisibility = ProfileVisibility.Public;
    //     } else if (i < 8) {
    //       profileVisibility = ProfileVisibility.FriendsOnly;
    //     } else {
    //       profileVisibility = ProfileVisibility.Private;
    //     }
    //     userData[i] = fakeUser({
    //       profile: fakeProfile({ profileVisibility }),
    //     });
    //   }
    //   await Users.insertMany([...userData]);
    //   const userManager = new DefaultUserManager(mongoClient, Log);
    //   const expected = userData
    //     .slice(0, 4)
    //     .sort((a, b) => b.memberSince.valueOf() - a.memberSince.valueOf())
    //     .map((data) => new DefaultUser(mongoClient, Log, data));
    //   const actual = await userManager.searchUsers({
    //     profileVisibleTo: 'public',
    //     sortBy: UsersSortBy.MemberSince,
    //     sortOrder: SortOrder.Descending,
    //   });
    //   expect(actual).toEqual(expected);
    // });
  });
});
