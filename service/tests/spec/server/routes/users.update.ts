import { faker } from '@faker-js/faker';
import { createMocks } from 'node-mocks-http';
import { UserRole } from '../../../../src/constants';
import { ForbiddenError, ValidationError } from '../../../../src/errors';
import {
  changeEmail,
  changePassword,
  changeRole,
  changeUsername,
  lockAccount,
  unlockAccount,
} from '../../../../src/server/routes/users';
import { DefaultUser } from '../../../../src/users/default-user';
import { fakePassword, fakeUser } from '../../../fixtures/fake-user';
import { mongoClient } from '../../../mongo-client';
import { createTestLogger } from '../../../test-logger';

const Log = createTestLogger('user-routes-update');

export default function () {
  describe('Update Email Address', () => {
    it('Will allow users to change their own email', async () => {
      const newEmail = faker.internet.email();
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          newEmail,
        },
      });
      const next = jest.fn();
      const spy = jest.spyOn(user, 'changeEmail').mockResolvedValue();

      await changeEmail(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
      expect(spy).toBeCalledWith(newEmail);
    });

    it('Will throw an error if changing email fails', async () => {
      const error = new Error('fails');
      const newEmail = faker.internet.email();
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          newEmail,
        },
      });
      const next = jest.fn();
      const spy = jest.spyOn(user, 'changeEmail').mockRejectedValue(error);

      await changeEmail(req, res, next);

      expect(spy).toBeCalledWith(newEmail);
      expect(next).toBeCalledWith(error);
      expect(res._isEndCalled()).toBe(false);
    });

    it('Will respond with ValidationError if the request body is invalid', async () => {
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          newEmail: false,
        },
      });
      const next = jest.fn();
      const spy = jest.spyOn(user, 'changeEmail');

      await changeEmail(req, res, next);

      expect(spy).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(res._isEndCalled()).toBe(false);
    });

    it("Will not allow users to change another users' email", async () => {
      const newEmail = faker.internet.email();
      const userData = fakeUser();
      const selectedUserData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);
      const selectedUser = new DefaultUser(mongoClient, Log, selectedUserData);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser,
        body: {
          newEmail,
        },
      });
      const next = jest.fn();
      const spy = jest.spyOn(selectedUser, 'changeEmail');

      await changeEmail(req, res, next);

      expect(spy).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
      expect(res._isEndCalled()).toBe(false);
    });

    it("Will allow admins to change other users' emails", async () => {
      const newEmail = faker.internet.email();
      const userData = fakeUser({ role: UserRole.Admin });
      const selectedUserData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);
      const selectedUser = new DefaultUser(mongoClient, Log, selectedUserData);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser,
        body: {
          newEmail,
        },
      });
      const next = jest.fn();
      const spy = jest.spyOn(selectedUser, 'changeEmail');

      await changeEmail(req, res, next);

      expect(next).not.toBeCalled();
      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
      expect(spy).toBeCalledWith(newEmail);
    });
  });

  describe('Change Password', () => {
    it('Will allow a user to change their password', async () => {
      const oldPassword = fakePassword();
      const newPassword = fakePassword();
      const data = fakeUser({}, oldPassword);
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          oldPassword,
          newPassword,
        },
      });
      const spy = jest.spyOn(user, 'changePassword').mockResolvedValue(true);
      const next = jest.fn();

      await changePassword(req, res, next);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
      expect(spy).toBeCalledWith(oldPassword, newPassword);
      expect(next).not.toBeCalled();
    });

    it('Will respond with a ValidationError if the old password is incorrect', async () => {
      const oldPassword = fakePassword();
      const newPassword = fakePassword();
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          oldPassword,
          newPassword,
        },
      });
      const spy = jest.spyOn(user, 'changePassword').mockResolvedValue(false);
      const next = jest.fn();

      await changePassword(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(spy).toBeCalledWith(oldPassword, newPassword);
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });

    it('Will respond with ValidationError if request body does not pass validation', async () => {
      const oldPassword = fakePassword();
      const newPassword = fakePassword();
      const data = fakeUser({}, oldPassword);
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          oldPassword: 17,
          newishPassword: newPassword,
        },
      });
      const spy = jest.spyOn(user, 'changePassword').mockResolvedValue(false);
      const next = jest.fn();

      await changePassword(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(spy).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });

    it("Will return an error if an exception is thrown while changing a user's password", async () => {
      const error = new Error('nope');
      const oldPassword = fakePassword();
      const newPassword = fakePassword();
      const data = fakeUser({}, oldPassword);
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          oldPassword,
          newPassword,
        },
      });
      const spy = jest.spyOn(user, 'changePassword').mockRejectedValue(error);
      const next = jest.fn();

      await changePassword(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(spy).toBeCalledWith(oldPassword, newPassword);
      expect(next).toBeCalledWith(error);
    });

    it("Will not allow a user to change another user's password", async () => {
      const oldPassword = fakePassword();
      const newPassword = fakePassword();
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser({}, oldPassword);
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
        body: {
          oldPassword,
          newPassword,
        },
      });
      const spy = jest.spyOn(user, 'changePassword');
      const next = jest.fn();

      await changePassword(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(spy).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    });
  });

  describe('Change Role', () => {
    it("Will change a user's role", async () => {
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser();
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
        body: {
          newRole: UserRole.Admin,
        },
      });
      const spy = jest.spyOn(user, 'changeRole').mockResolvedValue();
      const next = jest.fn();

      await changeRole(req, res, next);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
      expect(next).not.toBeCalled();
      expect(spy).toBeCalledWith(UserRole.Admin);
    });

    it('Will return an error if an exception is thrown', async () => {
      const error = new Error('Uh oh!');
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser();
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
        body: {
          newRole: UserRole.Admin,
        },
      });
      const spy = jest.spyOn(user, 'changeRole').mockRejectedValue(error);
      const next = jest.fn();

      await changeRole(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(spy).toBeCalledWith(UserRole.Admin);
      expect(next).toBeCalledWith(error);
    });

    it('Will return a ValidationError if the request body is invalid', async () => {
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser();
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
        body: {
          newRole: 'supreme_leader',
        },
      });
      const spy = jest.spyOn(user, 'changeRole');
      const next = jest.fn();

      await changeRole(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(spy).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });

    it('Will throw a ForbiddenError if a user tries to change their own role', async () => {
      const adminData = fakeUser({ role: UserRole.Admin });
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: admin,
        body: {
          newRole: UserRole.User,
        },
      });
      const spy = jest.spyOn(admin, 'changeRole');
      const next = jest.fn();

      await changeRole(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(spy).not.toBeCalled();
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    });
  });

  describe('Change Username', () => {
    it('Will allow a user to change their username', async () => {
      const newUsername = faker.internet.userName();
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          newUsername,
        },
      });
      const spy = jest.spyOn(user, 'changeUsername');
      const next = jest.fn();

      await changeUsername(req, res, next);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
      expect(next).not.toBeCalled();
      expect(spy).toBeCalledWith(newUsername);
    });

    it('Will return an error if an exception is thrown', async () => {
      const error = new Error('Nope');
      const newUsername = faker.internet.userName();
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          newUsername,
        },
      });
      const spy = jest.spyOn(user, 'changeUsername').mockRejectedValue(error);
      const next = jest.fn();

      await changeUsername(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalledWith(error);
      expect(spy).toBeCalledWith(newUsername);
    });

    it('Will return a ValidationError if the request body is invalid', async () => {
      const newUsername = faker.internet.userName();
      const data = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: user,
        body: {
          updatedUsername: newUsername,
        },
      });
      const spy = jest.spyOn(user, 'changeUsername');
      const next = jest.fn();

      await changeUsername(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(spy).not.toBeCalled();
    });

    it("Will return a ForbiddenError if user attempts to change another user's username", async () => {
      const newUsername = faker.internet.userName();
      const data = fakeUser();
      const otherUserData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, data);
      const otherUser = new DefaultUser(mongoClient, Log, otherUserData);
      const { req, res } = createMocks({
        log: Log,
        user,
        selectedUser: otherUser,
        body: {
          newUsername,
        },
      });
      const spy = jest.spyOn(otherUser, 'changeUsername');
      const next = jest.fn();

      await changeUsername(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
      expect(spy).not.toBeCalled();
    });

    it("Will allow admins to change another user's username", async () => {
      const newUsername = faker.internet.userName();
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser();
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
        body: {
          newUsername,
        },
      });
      const spy = jest.spyOn(user, 'changeUsername');
      const next = jest.fn();

      await changeUsername(req, res, next);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
      expect(next).not.toBeCalled();
      expect(spy).toBeCalledWith(newUsername);
    });
  });

  describe('Lock and Unlock Accounts', () => {
    it('Will lock an account', async () => {
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser();
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
      });
      const spy = jest.spyOn(user, 'lockAccount');
      const next = jest.fn();

      await lockAccount(req, res, next);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
      expect(next).not.toBeCalled();
      expect(spy).toBeCalled();
    });

    it('Will unlock an account', async () => {
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser();
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
      });
      const spy = jest.spyOn(user, 'unlockAccount');
      const next = jest.fn();

      await unlockAccount(req, res, next);

      expect(res._isEndCalled()).toBe(true);
      expect(res._getStatusCode()).toBe(204);
      expect(next).not.toBeCalled();
      expect(spy).toBeCalled();
    });

    it('Will return an error if an exception occurs while locking an account', async () => {
      const error = new Error('Lame!!');
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser();
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
      });
      const spy = jest.spyOn(user, 'lockAccount').mockRejectedValue(error);
      const next = jest.fn();

      await lockAccount(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalledWith(error);
      expect(spy).toBeCalled();
    });

    it('Will return an error if an exception occurs while unlocking an account', async () => {
      const error = new Error('Lame!!');
      const adminData = fakeUser({ role: UserRole.Admin });
      const userData = fakeUser();
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const user = new DefaultUser(mongoClient, Log, userData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: user,
      });
      const spy = jest.spyOn(user, 'unlockAccount').mockRejectedValue(error);
      const next = jest.fn();

      await unlockAccount(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalledWith(error);
      expect(spy).toBeCalled();
    });

    it('Will not allow admins to lock their own account', async () => {
      const adminData = fakeUser({ role: UserRole.Admin });
      const admin = new DefaultUser(mongoClient, Log, adminData);
      const { req, res } = createMocks({
        log: Log,
        user: admin,
        selectedUser: admin,
      });
      const spy = jest.spyOn(admin, 'lockAccount');
      const next = jest.fn();

      await lockAccount(req, res, next);

      expect(res._isEndCalled()).toBe(false);
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
      expect(spy).not.toBeCalled();
    });
  });
}
