import bodyParser from 'body-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import { Strategy as LocalStrategy } from 'passport-local';
import MongoDbSessionStore from 'connect-mongo';
import passport from 'passport';
import session from 'express-session';
import useragent from 'express-useragent';
import { v4 as uuid } from 'uuid';

import { ServerDependencies } from './dependencies';
import { Collections } from '../data';
import config from '../config';
import { configureRouting } from './routes';
import { deserializeUser, loginWithPassword, serializeUser } from './passport';

export async function createServer(
  createDependencies: () => Promise<ServerDependencies>,
): Promise<Express> {
  const { log, mongoClient, userManager } = await createDependencies();
  const app = express();

  log.debug(
    '[EXPRESS] Adding middleware to parse query strings, JSON bodies, and User Agent strings...',
  );
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(useragent.express());

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
      rolling: true,
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
      httpMethod: req.method,
      httpRoute: req.originalUrl,
      ip: req.ip,
      requestId: req.requestId,
      user: req.user?.username,
      useragent: req.useragent?.source,
    });
    req.userManager = userManager;
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
  app.use(passport.initialize());
  app.use(passport.session());

  log.debug('[EXPRESS] Adding API routes...');
  configureRouting(app, log);

  return app;
}
