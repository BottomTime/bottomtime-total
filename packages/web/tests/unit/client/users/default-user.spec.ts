import request from 'superagent';
import { DefaultUser } from '@/client/users';
import { fakeUser } from '../../../fixtures/fake-user';
import { scope } from '../../../utils/scope';

describe('Default User Class', () => {
  it('Will return properties correctly', () => {
    const data = fakeUser();
    const agent = request.agent();
    const user = new DefaultUser(agent, data);

    expect(user.id).toEqual(data.id);
    expect(user.email).toEqual(data.email);
    expect(user.emailVerified).toEqual(data.emailVerified);
    expect(user.hasPassword).toEqual(data.hasPassword);
    expect(user.isLockedOut).toEqual(data.isLockedOut);
    expect(user.lastLogin).toEqual(data.lastLogin);
    expect(user.lastPasswordChange).toEqual(data.lastPasswordChange);
    expect(user.memberSince).toEqual(data.memberSince);
    expect(user.role).toEqual(data.role);
    expect(user.username).toEqual(data.username);
  });

  it('Will convert to a JSON object', () => {
    const data = fakeUser();
    const agent = request.agent();
    const user = new DefaultUser(agent, data);
    expect(user.toJSON()).toEqual(data);
  });

  it('Will change an email address', async () => {
    const newEmail = 'better_email@gmail.org';
    const data = fakeUser();
    const agent = request.agent();
    const user = new DefaultUser(agent, data);

    scope
      .post(`/api/users/${data.username}/changeEmail`, { newEmail })
      .reply(204);

    await user.changeEmail(newEmail);
    expect(data.email).toEqual(newEmail);
    expect(data.emailVerified).toBe(false);
  });

  it('Will change username', async () => {
    const newUsername = 'matilda_19';
    const data = fakeUser();
    const agent = request.agent();
    const user = new DefaultUser(agent, data);

    scope
      .post(`/api/users/${data.username}/changeUsername`, { newUsername })
      .reply(204);

    await user.changeUsername(newUsername);
    expect(data.username).toEqual(newUsername);
  });

  it('Will request email verification', async () => {
    const data = fakeUser();
    const agent = request.agent();
    const user = new DefaultUser(agent, data);

    scope
      .post(`/api/users/${data.username}/requestEmailVerification`)
      .reply(204);

    await user.requestVerificationEmail();
  });

  [true, false].forEach((testCase) => {
    it(`Will return ${testCase} if verifying an email address is ${
      testCase ? 'successful' : 'unsuccessful'
    }`, async () => {
      const token = 'asdfasdfasfasefwefawef';
      const data = fakeUser();
      const agent = request.agent();
      const user = new DefaultUser(agent, data);

      scope
        .post(`/api/users/${data.username}/verifyEmail`, { token })
        .reply(200, { verified: testCase });

      await expect(user.verifyEmail(token)).resolves.toBe(testCase);
    });
  });
});
