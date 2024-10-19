import {
  CreateUserParamsDTO,
  LogBookSharing,
  SortOrder,
  UserRole,
  UsersSortBy,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';
import { ConflictException } from '@nestjs/common';

import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import * as uuid from 'uuid';

import { FriendshipEntity, UserEntity } from '../../../src/data';
import { User, UsersService } from '../../../src/users';
import { dataSource } from '../../data-source';
import SearchData from '../../fixtures/user-search-data.json';
import { createTestUser, parseUserJSON } from '../../utils';
import { createTestFriendship } from '../../utils/create-test-friendship';

const TestUserData: Partial<UserEntity> = {
  id: '4e64038d-0abf-4c1a-b678-55f8afcb6b2d',
  username: 'DonkeyKong33',
  usernameLowered: 'donkeykong33',
  email: 'dk@aol.com',
  emailLowered: 'dk@aol.com',
};

jest.mock('uuid');
jest.mock('bcryptjs');

describe('Users Service', () => {
  let Users: Repository<UserEntity>;
  let Friends: Repository<FriendshipEntity>;
  let service: UsersService;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Friends = dataSource.getRepository(FriendshipEntity);
    service = new UsersService(Users);
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
      const result = await service.getUserById(faker.string.uuid());
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
        .spyOn(uuid, 'v7')
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
          bio: "I don't talk about my dive clug",
          experienceLevel: 'Experienced',
          location: 'Vancouver, BC',
          name: 'Tyler Durden, Esq.',
          startedDiving: '2011',
          logBookSharing: LogBookSharing.Public,
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
    let users: UserEntity[];

    beforeAll(async () => {
      users = SearchData.map((user) => parseUserJSON(user));
    });

    beforeEach(async () => {
      await Users.save(users);
    });

    it('will return an empty array if no results match', async () => {
      await Users.createQueryBuilder().delete().from(UserEntity).execute();
      await expect(service.searchUsers()).resolves.toEqual({
        users: [],
        totalCount: 0,
      });
    });

    it('will perform text based searches', async () => {
      const results = await service.searchUsers({ query: 'Town' });

      expect(results.users).toHaveLength(2);
      expect(results.totalCount).toBe(2);
      expect(
        results.users.map((u) => ({
          id: u.id,
          username: u.username,
          memberSince: u.memberSince,
        })),
      ).toMatchSnapshot();
    });

    it('will allow filtering out profiles of users who are already friends', async () => {
      const friendRelations: FriendshipEntity[] = [
        createTestFriendship(
          users[0].id,
          '007f3635-e492-4a43-83e5-55de54b4e3fd',
        ),
        createTestFriendship(
          '007f3635-e492-4a43-83e5-55de54b4e3fd',
          users[0].id,
        ),

        createTestFriendship(
          users[0].id,
          'e8086bb6-10a8-4070-abb9-965acdc04ea3',
        ),
        createTestFriendship(
          'e8086bb6-10a8-4070-abb9-965acdc04ea3',
          users[0].id,
        ),

        createTestFriendship(
          users[0].id,
          '921811b8-2bab-40e9-b491-dd79dea9caf8',
        ),
        createTestFriendship(
          '921811b8-2bab-40e9-b491-dd79dea9caf8',
          users[0].id,
        ),
      ];
      await Friends.save(friendRelations);

      const results = await service.searchUsers({
        filterFriendsFor: users[0].id,
        limit: 15,
      });

      expect(results.totalCount).toBe(96);
      expect(
        results.users.map((u) => ({ id: u.id, username: u.username })),
      ).toMatchSnapshot();
    });

    it('will limit "page" size', async () => {
      const results = await service.searchUsers({ limit: 7 });
      expect(results.users).toHaveLength(7);
      expect(results.totalCount).toBe(100);
      expect(
        results.users.map((u: User) => ({
          id: u.id,
          username: u.username,
          memberSince: u.memberSince,
        })),
      ).toMatchSnapshot();
    });

    it('will allow showing results beyond the first page', async () => {
      const results = await service.searchUsers({ limit: 7, skip: 7 });
      expect(results.users).toHaveLength(7);
      expect(results.totalCount).toBe(100);
      expect(
        results.users.map((u: User) => ({
          id: u.id,
          username: u.username,
          memberSince: u.memberSince,
        })),
      ).toMatchSnapshot();
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
  });
});
