import { sign } from 'jsonwebtoken';
import { createRequest } from 'node-mocks-http';

import { Config } from '../../../src/config';
import { extractJwt } from '../../../src/jwt/extract-jwt';

const TestJwt = sign({ sub: 'fred' }, 'abcd1234');

jest.mock('../../../src/config');

describe('Extract JWT', () => {
  it('will extract a JWT from the x-bt-auth header', () => {
    const req = createRequest({
      headers: {
        'x-bt-auth': TestJwt,
      },
    });
    expect(extractJwt(req)).toBe(TestJwt);
  });

  it('will extract a JWT from the auth cookie', () => {
    const cookieName = 'mah-cookie';
    jest.mocked(Config).cookie.name = cookieName;
    const req = createRequest({
      cookies: {
        [cookieName]: TestJwt,
      },
    });
    expect(extractJwt(req)).toBe(TestJwt);
  });

  it('will return undefined if the JWT is not found in the request', () => {
    const req = createRequest();
    expect(extractJwt(req)).toBeUndefined();
  });
});
