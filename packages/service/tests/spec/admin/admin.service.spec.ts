/* eslint-disable no-process-env */
import { UserRole } from '@bottomtime/api';
import { AdminService } from '../../../src/admin';
import { UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';
import { createTestUser } from '../../utils';
import { compare } from 'bcrypt';

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
});
