import { AccountTier, SortOrder, UserRole, UsersSortBy } from '@bottomtime/api';

import { compare } from 'bcryptjs';
import { Repository } from 'typeorm';

import { AdminService } from '../../../src/admin';
import { Config } from '../../../src/config';
import { UserEntity } from '../../../src/data';
import { UserFactory } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestUserData from '../../fixtures/user-search-data.json';
import { InsertableUser, createTestUser, createUserFactory } from '../../utils';

jest.mock('../../../src/config');

describe('Admin Service', () => {
  const newPassword = 'IUHI9h023480213(*&*^^&';
  let Users: Repository<UserEntity>;
  let userFactory: UserFactory;
  let service: AdminService;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    userFactory = createUserFactory();
    service = new AdminService(Users, userFactory);
    Config.passwordSaltRounds = 1;
  });

  [
    { from: UserRole.User, to: UserRole.Admin },
    { from: UserRole.Admin, to: UserRole.User },
  ].forEach((testCase) => {
    it(`will change a user role from ${testCase.from} to ${testCase.to}`, async () => {
      const data = createTestUser({ role: testCase.from });
      const user = userFactory.createUser(data);
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
    const user = userFactory.createUser(data);
    await Users.save(data);

    await expect(service.lockAccount(user.username)).resolves.toBe(true);

    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.isLockedOut).toBe(true);
  });

  it('will return true when locking account that is already suspended', async () => {
    const data = createTestUser({ isLockedOut: true });
    const user = userFactory.createUser(data);
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
    const user = userFactory.createUser(data);
    await Users.save(data);

    await expect(service.unlockAccount(user.username)).resolves.toBe(true);

    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.isLockedOut).toBe(false);
  });

  it('will return true when unlocking account that is not suspended', async () => {
    const data = createTestUser({ isLockedOut: false });
    const user = userFactory.createUser(data);
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
    const user = userFactory.createUser(data);
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

  it("will change a user's membership tier", async () => {
    const data = createTestUser({ accountTier: AccountTier.Pro });
    const user = userFactory.createUser(data);
    await Users.save(data);

    await expect(
      service.changeMembership(user.username, AccountTier.ShopOwner),
    ).resolves.toBe(true);

    const stored = await Users.findOneByOrFail({ id: user.id });
    expect(stored.accountTier).toBe(AccountTier.ShopOwner);
  });

  it('will return false if changing a membership tier for a user that does not exist', async () => {
    await expect(
      service.changeMembership('does-not-exist', AccountTier.Pro),
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
      await Users.save(users);
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
        limit: 50,
        skip: 0,
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
        query: 'Taylor',
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
          limit: 15,
          skip: 0,
          sortBy,
          sortOrder,
        });
        expect({
          totalCount: results.totalCount,
          users: results.data.map((user) => ({
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
          users: results.data.map((user) => ({
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
      expect(results.data.length).toBe(12);
      expect(results.totalCount).toBe(100);
      expect(results.data.map((user) => user.username)).toMatchSnapshot();
    });
  });
});
