import { JwtPayload, decode, verify } from 'jsonwebtoken';

import { Config } from '../../../src/config';
import { JwtService } from '../../../src/jwt/jwt.service';

const Secret = '1XPOJPXMHJlI8R4qT8ssvw';
jest.mock('../../../src/config');

describe('JWT service', () => {
  let service: JwtService;

  beforeAll(() => {
    service = new JwtService();
  });

  beforeEach(() => {
    jest.useFakeTimers({
      now: new Date('2021-01-01T00:00:00Z'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('will sign a JWT', async () => {
    const email = 'user@email.com';
    const audience = ['env.bottomti.me', 'other.bottomti.me'];
    jest.mocked(Config).sessionSecret = Secret;

    const jwt = await service.signJwt(email, audience);

    const payload: JwtPayload = verify(jwt, Secret) as JwtPayload;
    expect(payload.sub).toBe(email);
    expect(payload.aud).toEqual(audience);
    expect(payload.jti).toHaveLength(86);
    expect(payload.exp).toBe(1610064000);
  });
});
