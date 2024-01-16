import { UsersService, User } from '../../../src/users';
import { createTestUser } from '../../utils';
import {
  FriendDocument,
  FriendModel,
  UserData,
  UserDocument,
  UserModel,
} from '../../../src/schemas';
import {
  CreateUserParamsDTO,
  ProfileVisibility,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';
import * as uuid from 'uuid';
import bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';
import { faker } from '@faker-js/faker';

import SearchData from '../../fixtures/user-search-data.json';

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
    service = new UsersService(UserModel, FriendModel);
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

    it('will create new users with minimal options', async () => {
      const options: CreateUserParamsDTO = {
        username: 'Roger69_83',
      };
      const user = await service.createUser(options);

      expect(user.toJSON()).toMatchSnapshot();

      const data = await UserModel.findById(user.id);
      expect(data).toMatchSnapshot();
    });

    it('will create a new user with all options set', async () => {
      const options: CreateUserParamsDTO = {
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
      const options: CreateUserParamsDTO = {
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
      const options: CreateUserParamsDTO = {
        username,
      };
      await existingUser.save();

      await expect(service.createUser(options)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('when searching profiles', () => {
    let friends: FriendDocument[];
    let users: UserDocument[];

    beforeAll(async () => {
      const now = new Date();
      friends = [];
      users = SearchData.map((user) => new UserModel(user));
      users.forEach((user, index) => {
        switch (index % 3) {
          case 0:
            user.settings = { profileVisibility: ProfileVisibility.Public };
            break;

          case 1:
            user.settings = {
              profileVisibility: ProfileVisibility.FriendsOnly,
            };
            if (index % 6 === 1) {
              friends.push(
                new FriendModel({
                  _id: faker.datatype.uuid(),
                  userId: users[0]._id,
                  friendId: users[index]._id,
                  friendsSince: now,
                }),
                new FriendModel({
                  _id: faker.datatype.uuid(),
                  userId: users[index]._id,
                  friendId: users[0]._id,
                  friendsSince: now,
                }),
              );
            }
            break;

          case 2:
            user.settings = { profileVisibility: ProfileVisibility.Private };
            break;
        }
      });
    });

    beforeEach(async () => {
      await Promise.all([
        UserModel.insertMany(users),
        FriendModel.insertMany(friends),
      ]);
    });

    it('will return an empty array if no results match', async () => {
      await UserModel.deleteMany({});
      await expect(service.searchUsers()).resolves.toEqual({
        users: [],
        totalCount: 0,
      });
    });

    it('will perform text based searches', async () => {
      await expect(
        service.searchUsers({ query: 'Mount' }),
      ).resolves.toMatchSnapshot();
    });

    it('will limit "page" size', async () => {
      const results = await service.searchUsers({ limit: 7 });
      expect(results.users).toHaveLength(7);
      expect(results).toMatchSnapshot();
    });

    it('will allow showing results beyond the first page', async () => {
      const results = await service.searchUsers({ limit: 7, skip: 7 });
      expect(results.users).toHaveLength(7);
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

    it('Will return public profiles and profiles belonging to friends when "profilesVisibleTo" parameter is a user Id', async () => {
      const result = await service.searchUsers({
        profileVisibleTo: users[0]._id,
      });

      expect(result.totalCount).toBe(101);
      expect(
        result.users.map((u) => ({
          username: u.username,
          profileVisibility: u.settings.profileVisibility,
        })),
      ).toMatchSnapshot();
    });

    it('Will return all public profiles when profileVisibleTo is set to "#public"', async () => {
      const result = await service.searchUsers({
        profileVisibleTo: '#public',
      });

      expect(result.totalCount).toBe(67);
      expect(
        result.users.map((u) => ({
          username: u.username,
          profileVisibility: u.settings.profileVisibility,
        })),
      ).toMatchSnapshot();
    });
  });
});
