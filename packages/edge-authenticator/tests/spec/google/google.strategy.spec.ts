import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { UnauthorizedException } from '@nestjs/common';

import { Profile } from 'passport-google-oauth20';

import { GoogleStrategy } from '../../../src/google/google.strategy';
import { User } from '../../../src/user';
import { UserService } from '../../../src/user.service';

const TestUser: User = {
  email: 'bro_down@gmail.com',
  authorizedDomains: ['downtown.email'],
};
const TestProfile: Profile = {
  emails: [{ value: TestUser.email, verified: true }],
  displayName: 'Test User',
  id: '1234567890',
  profileUrl: 'https://google.com/profile',
  provider: 'google',
  _json: {} as Profile['_json'],
  _raw: '',
};

describe('Google Passport strategy', () => {
  let users: UserService;
  let strategy: GoogleStrategy;

  beforeAll(() => {
    users = new UserService(new DynamoDBClient());
    strategy = new GoogleStrategy(users);
  });

  it('will return a user for a valid Google profile', async () => {
    const spy = jest.spyOn(users, 'findUser').mockResolvedValue(TestUser);
    await expect(strategy.validate('', '', TestProfile)).resolves.toEqual(
      TestUser,
    );
    expect(spy).toHaveBeenCalledWith(TestUser.email);
  });

  it('will throw an error if the profile does not have an email', async () => {
    const profile = { ...TestProfile, emails: [] };
    await expect(strategy.validate('', '', profile)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('will throw an error if the user cannot be found', async () => {
    const spy = jest.spyOn(users, 'findUser').mockResolvedValue(undefined);
    await expect(strategy.validate('', '', TestProfile)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(spy).toHaveBeenCalledWith(TestUser.email);
  });
});
