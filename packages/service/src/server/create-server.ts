import bodyParser from 'body-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import MongoDbSessionStore from 'connect-mongo';
import passport from 'passport';
import rewrite from 'express-urlrewrite';
import session from 'express-session';
import useragent from 'express-useragent';
import { v4 as uuid } from 'uuid';

import { ServerDependencies } from './dependencies';
import { Collections } from '../data';
import config from '../config';
import { configureRouting } from './routes';
import {
  deserializeUser,
  loginWithBearerToken,
  loginWithPassword,
  serializeUser,
} from './passport';

export async function createServer(
  createDependencies: () => Promise<ServerDependencies>,
): Promise<Express> {
  const { log, mail, mongoClient, tankManager, userManager } =
    await createDependencies();
  const app = express();

  log.debug(
    '[EXPRESS] Adding middleware to parse query strings, JSON bodies, and User Agent strings...',
  );
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
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

  log.debug('[EXPRESS] Initializing MongoDB session store...');
  const sessionStore = MongoDbSessionStore.create({
    client: mongoClient,
    collectionName: Collections.Sessions,
  });
  sessionStore.on('error', log.error);

  app.use(
    session({
      name: config.sessions.cookieName,
      secret: config.sessions.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: false,
      store: sessionStore,
      cookie: {
        domain: config.sessions.cookieDomain,
        httpOnly: true,
        maxAge: config.sessions.cookieTTL * 60 * 1000,
        secure: false,
      },
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
  passport.serializeUser<string>(serializeUser);
  passport.deserializeUser<string>(deserializeUser);
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'usernameOrEmail',
        passReqToCallback: true,
      },
      loginWithPassword,
    ),
  );
  passport.use(new JwtStrategy({}, verifyJwtToken));
  app.use(passport.initialize());
  app.use(passport.session());

  log.debug('[EXPRESS] Adding API routes...');
  configureRouting(app, log);

  return app;
}
