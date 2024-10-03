import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { UnauthorizedException } from '@nestjs/common';

import { JwtPayload } from 'jsonwebtoken';

import { JwtStrategy } from '../../../src/jwt/jwt.strategy';
import { User } from '../../../src/user';
import { UserService } from '../../../src/user.service';

const Audience = 'site.edu';
const TestUser: User = {
  email: 'theuser@site.edu',
  authorizedDomains: [Audience, 'example.com'],
};

describe('Jwt Passport strategy', () => {
  let users: UserService;
  let strategy: JwtStrategy;

  beforeAll(() => {
    users = new UserService(new DynamoDBClient());
    strategy = new JwtStrategy(users);
  });

  it('will return a user for a valid JWT', async () => {
    const payload: JwtPayload = {
      aud: TestUser.authorizedDomains,
      sub: TestUser.email,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    };

    jest.spyOn(users, 'findUser').mockResolvedValue(TestUser);

    await expect(strategy.validate(payload)).resolves.toEqual(TestUser);
  });

  it('will throw an error if the JWT has no subject', async () => {
    const payload: JwtPayload = {
      aud: TestUser.authorizedDomains,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('will throw an error if the JWT has no audience', async () => {
    const payload: JwtPayload = {
      sub: TestUser.email,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('will throw an error if the user is not found', async () => {
    const payload: JwtPayload = {
      aud: TestUser.authorizedDomains,
      sub: TestUser.email,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    };

    jest.spyOn(users, 'findUser').mockResolvedValue(undefined);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
