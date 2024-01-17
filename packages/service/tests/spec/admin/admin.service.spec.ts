/* eslint-disable no-process-env */
import { SortOrder, UserRole, UsersSortBy } from '@bottomtime/api';
import { AdminService } from '../../../src/admin';
import { UserDocument, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';
import { createTestUser } from '../../utils';
import { compare } from 'bcrypt';
import TestUserData from '../../fixtures/user-search-data.json';

describe('Admin Service', () => {
  const newPassword = 'IUHI9h023480213(*&*^^&';
  let service: AdminService;
  let oldEnv: object;

  beforeAll(() => {
    service = new AdminService(UserModel);
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
      const user = new User(UserModel, data);
      await data.save();

      await expect(
        service.changeRole(user.username, testCase.to),
      ).resolves.toBe(true);

      const stored = await UserModel.findById(user.id);
      expect(stored!.role).toBe(testCase.to);
    });
  });

  it('will return false if changing a role for a user that does not exist', async () => {
    await expect(
      service.changeRole('does-not-exist', UserRole.Admin),
    ).resolves.toBe(false);
  });

  it('will lock a user account', async () => {
    const data = createTestUser({ isLockedOut: false });
    const user = new User(UserModel, data);
    await data.save();

    await expect(service.lockAccount(user.username)).resolves.toBe(true);

    const stored = await UserModel.findById(user.id);
    expect(stored!.isLockedOut).toBe(true);
  });

  it('will return true when locking account that is already suspended', async () => {
    const data = createTestUser({ isLockedOut: true });
    const user = new User(UserModel, data);
    await data.save();

    await expect(service.lockAccount(user.username)).resolves.toBe(true);

    const stored = await UserModel.findById(user.id);
    expect(stored!.isLockedOut).toBe(true);
  });

  it('will return false if locking an account that does not exist', async () => {
    await expect(service.lockAccount('does-not-exist')).resolves.toBe(false);
  });

  it('will unlock a user account', async () => {
    const data = createTestUser({ isLockedOut: true });
    const user = new User(UserModel, data);
    await data.save();

    await expect(service.unlockAccount(user.username)).resolves.toBe(true);

    const stored = await UserModel.findById(user.id);
    expect(stored!.isLockedOut).toBe(false);
  });

  it('will return true when unlocking account that is not suspended', async () => {
    const data = createTestUser({ isLockedOut: false });
    const user = new User(UserModel, data);
    await data.save();

    await expect(service.unlockAccount(user.username)).resolves.toBe(true);

    const stored = await UserModel.findById(user.id);
    expect(stored!.isLockedOut).toBe(false);
  });

  it('will return false if unlocking an account that does not exist', async () => {
    await expect(service.unlockAccount('does-not-exist')).resolves.toBe(false);
  });

  it("will reset a user's password", async () => {
    const data = createTestUser();
    const user = new User(UserModel, data);
    await data.save();

    await expect(
      service.resetPassword(user.username, newPassword),
    ).resolves.toBe(true);

    const stored = await UserModel.findById(user.id);
    expect(stored!.lastPasswordChange?.valueOf()).toBeCloseTo(Date.now(), -2);
    await expect(compare(newPassword, stored!.passwordHash!)).resolves.toBe(
      true,
    );
  });

  it('will return false if resetting the password for a user that does not exist', async () => {
    await expect(
      service.resetPassword('does-not-exist', newPassword),
    ).resolves.toBe(false);
  });

  describe('when searching user accounts', () => {
    let users: UserDocument[];

    beforeAll(() => {
      users = TestUserData.map((user) => new UserModel(user));
    });

    beforeEach(async () => {
      await UserModel.insertMany(users);
    });

    it('will return a list of users', async () => {
      const results = await service.searchUsers({
        limit: 10,
        skip: 0,
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
      });
      expect(JSON.parse(JSON.stringify(results))).toMatchSnapshot();
    });

    it('will perform a text-based search', async () => {
      const results = await service.searchUsers({
        limit: 10,
        skip: 0,
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
        query: 'Dave',
      });
      expect(JSON.parse(JSON.stringify(results))).toMatchSnapshot();
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
