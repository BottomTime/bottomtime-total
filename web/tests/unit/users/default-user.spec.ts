import request from 'superagent';
import { DefaultUser } from '@/users';
import { fakeUser } from '../../fixtures/fake-user';

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
});
