import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, type Express } from 'express';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import rewrite from 'express-urlrewrite';
import useragent from 'express-useragent';
import { v4 as uuid } from 'uuid';
import url from 'url';

import { ServerDependencies } from './dependencies';
import config from '../config';
import { configureRouting } from './routes';
import { loginWithGoogle, loginWithPassword, verifyJwtToken } from './passport';

export async function createServer(
  createDependencies: () => Promise<ServerDependencies>,
): Promise<Express> {
  const { log, mail, tankManager, userManager } = await createDependencies();
  const app = express();

  log.debug(
    '[EXPRESS] Adding middleware to parse query strings, JSON bodies, and User Agent strings...',
  );
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(useragent.express());
  app.use(rewrite('/api/*', '/$1'));

  log.debug('[EXPRESS] Adding CORS middleware...');
  app.use(
    cors({
      // TODO: Limit domains.
      origin: (_origin, cb) => {
        cb(null, true);
      },
      credentials: true,
    }),
  );

  log.debug('[EXPRESS] Adding middleware to build out request context...');
  app.use((req, _res, next) => {
    req.requestId = uuid();
    req.log = log.child({
      req_id: req.requestId,
      http_method: req.method,
      http_route: req.originalUrl,
      ip: req.ip,
      user: req.user?.username,
      useragent: req.useragent?.source,
    });
    req.mail = mail;
    req.tankManager = tankManager;
    req.userManager = userManager;

    req.log.debug(`Request made to ${req.method} ${req.originalUrl}`);
    next();
  });

  log.debug('[EXPRESS] Adding auth middleware...');
  passport.use(
    new JwtStrategy(
      {
        issuer: config.baseUrl,
        jsonWebTokenOptions: {},
        jwtFromRequest: (req: Request) =>
          req.cookies[config.sessions.cookieName] ?? null,
        passReqToCallback: true,
        secretOrKey: config.sessions.sessionSecret,
      },
      verifyJwtToken,
    ),
  );
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'usernameOrEmail',
        passReqToCallback: true,
      },
      loginWithPassword,
    ),
  );
  passport.use(
    new GoogleStrategy(
      {
        callbackURL: url.resolve(config.baseUrl, '/auth/google/callback'),
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        passReqToCallback: true,
        scope: ['email', 'profile'],
      },
      loginWithGoogle,
    ),
  );
  app.use(passport.initialize());

  log.debug('[EXPRESS] Adding API routes...');
  configureRouting(app, log);

  return app;
}
