import {
  CreateUserParamsDTO,
  ProfileVisibility,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';
import { ConflictException } from '@nestjs/common';

import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import * as uuid from 'uuid';

import { FriendshipEntity, UserEntity } from '../../../src/data';
import { User, UsersService } from '../../../src/users';
import { dataSource } from '../../data-source';
import SearchData from '../../fixtures/user-search-data.json';
import { createTestUser, parseUserJSON } from '../../utils';

const TestUserData: Partial<UserEntity> = {
  id: '4e64038d-0abf-4c1a-b678-55f8afcb6b2d',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
};

jest.mock('uuid');
jest.mock('bcrypt');

describe('Users Service', () => {
  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;

  let service: UsersService;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
    service = new UsersService(Users, Friends);
  });

  describe('when retrieving users', () => {
    it('will retrieve a user by id', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(Users, userDocument);

      await Users.save(userDocument);
      const actual = await service.getUserById(userDocument.id);

      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will retrieve a user by username', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(Users, userDocument);

      await Users.save(userDocument);
      const actual = await service.getUserByUsernameOrEmail(
        userDocument.username.toUpperCase(),
      );

      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will retrieve a user by email', async () => {
      const userDocument = createTestUser(TestUserData);
      const expected = new User(Users, userDocument);

      await Users.save(userDocument);
      const actual = await service.getUserByUsernameOrEmail(
        expected.email!.toUpperCase(),
      );
      expect(actual?.toJSON()).toEqual(expected.toJSON());
    });

    it('will return undefined if id is not found', async () => {
      const result = await service.getUserById(faker.datatype.uuid());
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
        .mockReturnValue('0ee2c4ff-1013-45df-9f13-e45ed2db9555');
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

      const data = await Users.findOneBy({ id: user.id });
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
          customData: {},
          experienceLevel: 'Experienced',
          location: 'Vancouver, BC',
          name: 'Tyler Durden, Esq.',
          startedDiving: '2011',
        },
      };

      const user = await service.createUser(options);

      expect(user.toJSON()).toMatchSnapshot();

      const data = await Users.findOneBy({ id: user.id });
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
      await Users.save(existingUser);

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
      await Users.save(existingUser);

      await expect(service.createUser(options)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('when searching profiles', () => {
    let friends: FriendshipEntity[];
    let users: UserEntity[];

    beforeAll(async () => {
      const now = new Date();
      friends = [];
      users = SearchData.map((user) => parseUserJSON(user));
      users.forEach((user, index) => {
        switch (index % 3) {
          case 0:
            user.profileVisibility = ProfileVisibility.Public;
            break;

          case 1:
            user.profileVisibility = ProfileVisibility.FriendsOnly;
            if (index % 6 === 1) {
              friends.push(
                {
                  id: faker.datatype.uuid(),
                  user: users[0],
                  friend: users[index],
                  friendsSince: now,
                },
                {
                  id: faker.datatype.uuid(),
                  user: users[index],
                  friend: users[0],
                  friendsSince: now,
                },
              );
            }
            break;

          case 2:
            user.profileVisibility = ProfileVisibility.Private;
            break;
        }
      });
    });

    beforeEach(async () => {
      await Users.save(users);
      await Friends.save(friends);
    });

    it('will return an empty array if no results match', async () => {
      await Users.createQueryBuilder().delete().from(UserEntity).execute();
      await expect(service.searchUsers()).resolves.toEqual({
        users: [],
        totalCount: 0,
      });
    });

    // TODO: Figure out how to get full text search working properly in Postgres. Might need MongoDB for this.
    it.skip('will perform text based searches', async () => {
      await expect(
        service.searchUsers({ query: 'Town' }),
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
        const results = await service.searchUsers({
          sortBy,
          sortOrder,
          limit: 5,
        });
        expect(
          results.users.map((u) => ({
            username: u.username,
            memberSince: u.memberSince,
          })),
        ).toMatchSnapshot();
      });
    });

    [UserRole.User, UserRole.Admin].forEach((role) => {
      it(`will filter by role: ${role}`, async () => {
        const results = await service.searchUsers({ role, limit: 10 });
        for (const user of results.users) {
          expect(user.role).toBe(role);
        }
      });
    });

    it('will return public profiles and profiles belonging to friends when "profilesVisibleTo" parameter is a user Id', async () => {
      const result = await service.searchUsers({
        profileVisibleTo: users[0].username,
      });

      expect(result.totalCount).toBe(17);
      expect(
        result.users.map((u) => ({
          username: u.username,
          profileVisibility: u.settings.profileVisibility,
        })),
      ).toMatchSnapshot();
    });

    it('will return all public profiles when profileVisibleTo is set to "#public"', async () => {
      const result = await service.searchUsers({
        profileVisibleTo: '#public',
      });

      expect(result.totalCount).toBe(34);
      expect(
        result.users.map((u) => ({
          username: u.username,
          profileVisibility: u.settings.profileVisibility,
        })),
      ).toMatchSnapshot();
    });
  });
});
