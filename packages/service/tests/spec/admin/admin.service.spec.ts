/* eslint-disable no-process-env */
import { SortOrder, UserRole, UsersSortBy } from '@bottomtime/api';

import { compare } from 'bcrypt';
import { Repository } from 'typeorm';

import { AdminService } from '../../../src/admin';
import { UserEntity } from '../../../src/data';
import { User } from '../../../src/users/user';
import { dataSource } from '../../data-source';
import TestUserData from '../../fixtures/user-search-data.json';
import { InsertableUser, createTestUser } from '../../utils';

describe('Admin Service', () => {
  const newPassword = 'IUHI9h023480213(*&*^^&';
  let Users: Repository<UserEntity>;
  let service: AdminService;
  let oldEnv: object;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    service = new AdminService(Users);
    oldEnv = Object.assign({}, process.env);
    process.env.PASSWORD_SALT_ROUNDS = '1';
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  [
    { from: UserRole.User, to: UserRole.Admin },
    { from: UserRole.Admin, to: UserRole.User },
  ].forEach((testCase) => {
    it(`will change a user role from ${testCase.from} to ${testCase.to}`, async () => {
      const data = createTestUser({ role: testCase.from });
      const user = new User(Users, data);
      await Users.save(data);

      await expect(
        service.changeRole(user.username, testCase.to),
      ).resolves.toBe(true);

      const stored = await Users.findOneByOrFail({ id: user.id });
      expect(stored.role).toBe(testCase.to);
    });
  });

  it('will return false if changing a role for a user that does not exist', async () => {
    await expect(
      service.changeRole('does-not-exist', UserRole.Admin),
    ).resolves.toBe(false);
  });

  it('will lock a user account', async () => {
    const data = createTestUser({ isLockedOut: false });
    const user = new User(Users, data);
    await Users.save(data);

    await expect(service.lockAccount(user.username)).resolves.toBe(true);

    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.isLockedOut).toBe(true);
  });

  it('will return true when locking account that is already suspended', async () => {
    const data = createTestUser({ isLockedOut: true });
    const user = new User(Users, data);
    await Users.save(data);

    await expect(service.lockAccount(user.username)).resolves.toBe(true);

    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.isLockedOut).toBe(true);
  });

  it('will return false if locking an account that does not exist', async () => {
    await expect(service.lockAccount('does-not-exist')).resolves.toBe(false);
  });

  it('will unlock a user account', async () => {
    const data = createTestUser({ isLockedOut: true });
    const user = new User(Users, data);
    await Users.save(data);

    await expect(service.unlockAccount(user.username)).resolves.toBe(true);

    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.isLockedOut).toBe(false);
  });

  it('will return true when unlocking account that is not suspended', async () => {
    const data = createTestUser({ isLockedOut: false });
    const user = new User(Users, data);
    await Users.save(data);

    await expect(service.unlockAccount(user.username)).resolves.toBe(true);

    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.isLockedOut).toBe(false);
  });

  it('will return false if unlocking an account that does not exist', async () => {
    await expect(service.unlockAccount('does-not-exist')).resolves.toBe(false);
  });

  it("will reset a user's password", async () => {
    const data = createTestUser();
    const user = new User(Users, data);
    await Users.save(data);

    await expect(
      service.resetPassword(user.username, newPassword),
    ).resolves.toBe(true);

    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.lastPasswordChange?.valueOf()).toBeCloseTo(Date.now(), -2);
    await expect(compare(newPassword, stored.passwordHash!)).resolves.toBe(
      true,
    );
  });

  it('will return false if resetting the password for a user that does not exist', async () => {
    await expect(
      service.resetPassword('does-not-exist', newPassword),
    ).resolves.toBe(false);
  });

  describe('when searching user accounts', () => {
    let users: InsertableUser[];

    beforeAll(() => {
      users = TestUserData.map((data) => {
        const user = new UserEntity();
        Object.assign(user, data);
        return user;
      });
    });

    beforeEach(async () => {
      await Users.createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values(users)
        .execute();
    });

    it('will return a list of users', async () => {
      const results = await service.searchUsers({
        limit: 10,
        skip: 0,
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
      });
      expect(results).toMatchSnapshot();
    });

    it('will perform a text-based search', async () => {
      const results = await service.searchUsers({
        limit: 10,
        skip: 0,
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
        query: 'Dave',
      });
      expect(results).toMatchSnapshot();
    });

    [
      { sortBy: UsersSortBy.Username, sortOrder: SortOrder.Ascending },
      { sortBy: UsersSortBy.Username, sortOrder: SortOrder.Descending },
      { sortBy: UsersSortBy.MemberSince, sortOrder: SortOrder.Ascending },
      { sortBy: UsersSortBy.MemberSince, sortOrder: SortOrder.Descending },
    ].forEach(({ sortBy, sortOrder }) => {
      it(`will sort results by ${sortBy} in ${sortOrder} order`, async () => {
        const results = await service.searchUsers({
          limit: 30,
          skip: 0,
          sortBy,
          sortOrder,
        });
        expect({
          totalCount: results.totalCount,
          users: results.users.map((user) => ({
            username: user.username,
            memberSince: user.memberSince,
          })),
        }).toMatchSnapshot();
      });
    });

    [UserRole.User, UserRole.Admin].forEach((role) => {
      it(`will filter results by role ${role}`, async () => {
        const results = await service.searchUsers({
          limit: 30,
          skip: 0,
          role,
          sortBy: UsersSortBy.Username,
          sortOrder: SortOrder.Ascending,
        });
        expect({
          totalCount: results.totalCount,
          users: results.users.map((user) => ({
            username: user.username,
            role: user.role,
          })),
        }).toMatchSnapshot();
      });
    });

    it('will allow pagination', async () => {
      const results = await service.searchUsers({
        limit: 12,
        skip: 80,
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
      });
      expect(results.users.length).toBe(12);
      expect(results.totalCount).toBe(200);
      expect(results.users.map((user) => user.username)).toMatchSnapshot();
    });
  });
});
