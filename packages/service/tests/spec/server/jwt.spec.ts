/* eslint-disable no-process-env */
import { createResponse } from 'node-mocks-http';
import jwt from 'jsonwebtoken';
import { Mock } from 'moq.ts';

import {
  JwtPayload,
  issueAuthCookie,
  signUserToken,
} from '../../../src/server/jwt';
import { User } from '../../../src/users';

const TwelveHoursInMinutes = 12 * 60;
const SevenDaysInMinutes = 7 * 24 * 60;
const SessionSecret = 'kitty_cat';
const UserId = '4dbef7dc-66c8-49e8-8a5a-d78c32042fec';

function verifyToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SessionSecret, {}, (error, payload) => {
      if (error) reject(error);
      else resolve(payload as JwtPayload);
    });
  });
}

describe('JWT utility functions', () => {
  let user: Mock<User>;
  let oldEnv: object;

  beforeAll(() => {
    oldEnv = Object.assign({}, process.env);
  });

  beforeEach(() => {
    user = new Mock<User>();
    user
      .setup((u) => u.id)
      .returns(UserId)
      .setup((u) => u.updateLastLogin())
      .returnsAsync();
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate'],
      now: 1690385751784,
    });
    Object.assign(process.env, {
      BT_BASE_URL: 'https://dev.bottomti.me/',
      BT_SESSION_COOKIE_DOMAIN: 'https://bottomti.me/',
      BT_SESSION_COOKIE_NAME: 'bottomtime.platform',
      BT_SESSION_COOKIE_TTL: TwelveHoursInMinutes.toString(10),
      BT_SESSION_SECRET: SessionSecret,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  it('Will issue a JWT for the designated user', async () => {
    const token = await signUserToken(user.object());
    await expect(verifyToken(token)).resolves.toMatchSnapshot();
  });

  it('Will issue issue JWT with expiration matching cookie TTL', async () => {
    process.env.BT_SESSION_COOKIE_TTL = SevenDaysInMinutes.toString(10);
    const token = await signUserToken(user.object());
    await expect(verifyToken(token)).resolves.toMatchSnapshot();
  });

  it('Will issue JWT with issuer matching service base url', async () => {
    process.env.BT_BASE_URL = 'http://localhost:8080/';
    const token = await signUserToken(user.object());
    await expect(verifyToken(token)).resolves.toMatchSnapshot();
  });

  it('Will issue a session cookie containing a JWT for the designated user', async () => {
    const res = createResponse();
    await issueAuthCookie(user.object(), res);
    expect(res.cookies).toMatchSnapshot();
  });

  it('Will issue a secure (HTTPS-only) cookie when in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = createResponse();
    await issueAuthCookie(user.object(), res);
    expect(res.cookies).toMatchSnapshot();
  });
});
