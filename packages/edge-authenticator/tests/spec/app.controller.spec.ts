import { HttpStatus } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { Express } from 'express';
import { sign } from 'jsonwebtoken';
import mustache from 'mustache-express';
import { resolve } from 'path';
import request from 'supertest';

import { AppController } from '../../src/app.controller';
import { Config } from '../../src/config';
import { DependenciesModule } from '../../src/dependencies.module';
import { GlobalErrorFilter } from '../../src/error.filter';
import { GoogleStrategy } from '../../src/google/google.strategy';
import { JwtService } from '../../src/jwt/jwt.service';
import { JwtStrategy } from '../../src/jwt/jwt.strategy';
import { BunyanLoggerService } from '../../src/logger';
import { User } from '../../src/user';
import { UserService } from '../../src/user.service';
import { Log } from '../logger';

const CookieName = 'the-cookie';
const Now = new Date('2024-10-03T12:50:47-04:00');
const SessionSecret = 'QduPYziYWxNDYNFUG4CaJn0Jh-xmYrYifarIwV_ujpo';
const TestUser: User = {
  email: 'tommy@gmail.org',
  authorizedDomains: ['gmail.org', 'othersite.com'],
};

function setupMocks() {
  const config = jest.mocked(Config);
  config.sessionSecret = SessionSecret;
  config.cookie.name = CookieName;

  jest.useFakeTimers({
    now: Now,
    doNotFake: ['setImmediate', 'nextTick'],
  });
}

jest.mock('../../src/config');

describe('AppController class', () => {
  let app: NestExpressApplication;
  let server: Express;
  let userService: UserService;
  let jwt: string;

  beforeAll(async () => {
    setupMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ session: false }),
        DependenciesModule.forRoot(),
      ],
      providers: [JwtService, JwtStrategy, GoogleStrategy, UserService],
      controllers: [AppController],
    }).compile();
    const logger = new BunyanLoggerService(Log);

    userService = moduleRef.get(UserService);

    app = moduleRef.createNestApplication<NestExpressApplication>({
      cors: {
        credentials: true,
        origin(_, cb) {
          cb(null, true);
        },
      },
      logger,
    });

    app.useGlobalFilters(new GlobalErrorFilter(logger));
    app.useStaticAssets(resolve(__dirname, '../../src/public/'));
    app.setBaseViewsDir(resolve(__dirname, '../../src/views/'));
    app.engine('mst', mustache());
    app.setViewEngine('mst');
    await app.init();

    server = app.getHttpAdapter().getInstance();

    const now = Now.valueOf() / 1000;
    jwt = sign(
      {
        aud: TestUser.authorizedDomains,
        sub: TestUser.email,
        iat: now,
        exp: now + 3600,
      },
      SessionSecret,
    );
  });

  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(async () => {
    await app.close();
  });

  it('will respond to a request for the home page as an anonymous user', async () => {
    const { text } = await request(server).get('/').expect(200);
    expect(text).toMatchSnapshot();
  });

  it('will respond to a request for the home page as an authenticated user', async () => {
    const spy = jest.spyOn(userService, 'findUser').mockResolvedValue(TestUser);
    const { text } = await request(server)
      .get('/')
      .set('x-bt-auth', jwt)
      .expect(HttpStatus.OK);
    expect(text).toMatchSnapshot();
    expect(spy).toHaveBeenCalledWith(TestUser.email);
  });

  it('will render the "unauthorized" page if JWT is forged with bad secret', async () => {
    const now = Now.valueOf() / 1000;
    const jwt = sign(
      {
        aud: TestUser.authorizedDomains,
        sub: TestUser.email,
        iat: now,
        exp: now + 3600,
      },
      'wrong_secret',
    );
    const spy = jest.spyOn(userService, 'findUser').mockResolvedValue(TestUser);

    const { text } = await request(server)
      .get('/')
      .set('x-bt-auth', jwt)
      .expect(HttpStatus.UNAUTHORIZED);

    expect(text).toMatchSnapshot();
    expect(spy).not.toHaveBeenCalled();
  });

  it('will render the "unauthorized" page if JWT is expired', async () => {
    const now = new Date('1957-02-03T09:06:11Z').valueOf() / 1000;
    const jwt = sign(
      {
        aud: TestUser.authorizedDomains,
        sub: TestUser.email,
        iat: now,
        exp: now + 3600,
      },
      SessionSecret,
    );
    const spy = jest.spyOn(userService, 'findUser').mockResolvedValue(TestUser);

    const { text } = await request(server)
      .get('/')
      .set('x-bt-auth', jwt)
      .expect(HttpStatus.UNAUTHORIZED);

    expect(text).toMatchSnapshot();
    expect(spy).not.toHaveBeenCalled();
  });

  it('will render the "unauthorized" page if JWT has invalid subject', async () => {
    const now = Now.valueOf() / 1000;
    const jwt = sign(
      {
        aud: TestUser.authorizedDomains,
        sub: TestUser.email,
        iat: now,
        exp: now + 3600,
      },
      SessionSecret,
    );
    const spy = jest
      .spyOn(userService, 'findUser')
      .mockResolvedValue(undefined);

    const { text } = await request(server)
      .get('/')
      .set('x-bt-auth', jwt)
      .expect(HttpStatus.UNAUTHORIZED);

    expect(text).toMatchSnapshot();
    expect(spy).toHaveBeenCalled();
  });

  it('will clear cookie and redirect back to home page on logout', async () => {
    const { headers } = await request(server).get('/logout').expect(302);
    expect(headers['set-cookie']).toBeDefined();
    expect(headers['set-cookie']).toHaveLength(1);
    const cookie = headers['set-cookie'][0]
      .split(';')
      .reduce<Record<string, string>>((acc, val) => {
        const [key, value] = val.split('=');
        acc[key.trim()] = value?.trim();
        return acc;
      }, {});

    expect(cookie[CookieName]).toBe('');
    expect(headers.location).toBe('/');
  });

  it('will redirect to google on login request', async () => {
    const { headers } = await request(server).get('/login').expect(302);
    expect(headers.location).toBeDefined();

    const location = new URL(headers.location);
    expect(location.hostname).toBe('accounts.google.com');
    expect(location.pathname).toBe('/o/oauth2/v2/auth');
    expect(location.searchParams.get('redirect_uri')).toEqual(
      `${Config.baseUrl}/callback`,
    );
    expect(location.searchParams.get('scope')).toEqual('email');
    expect(location.searchParams.get('client_id')).toEqual(
      Config.google.clientId,
    );
  });
});
