import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
  Request,
  Response,
  type Express,
  NextFunction,
} from 'express';
import { Strategy as GithubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import passport from 'passport';
import rewrite from 'express-urlrewrite';
import useragent from 'express-useragent';
import { v4 as uuid } from 'uuid';
import url from 'url';

import { ServerDependencies } from './dependencies';
import config from '../config';
import { configureRouting } from './routes';
import {
  loginWithGithub,
  loginWithGoogle,
  loginWithPassword,
  verifyJwtToken,
} from './passport';

export async function createServer(
  createDependencies: () => Promise<ServerDependencies>,
): Promise<Express> {
  const { log, mail, diveSiteManager, tankManager, userManager } =
    await createDependencies();
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
    req.diveSiteManager = diveSiteManager;
    req.tankManager = tankManager;
    req.userManager = userManager;

    next();
  });

  log.debug('[EXPRESS] Configuring Passport.js...');
  const jwtFromRequest = ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    (req: Request) => req.cookies[config.sessions.cookieName] ?? null,
  ]);
  passport.use(
    new JwtStrategy(
      {
        issuer: config.baseUrl,
        jsonWebTokenOptions: {},
        jwtFromRequest,
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
  passport.use(
    new GithubStrategy(
      {
        callbackURL: url.resolve(config.baseUrl, '/auth/github/callback'),
        clientID: config.github.clientId,
        clientSecret: config.github.clientSecret,
        passReqToCallback: true,
      },
      loginWithGithub,
    ),
  );
  app.use(passport.initialize());

  // Authenticate user and log the request.
  app.use(
    // Authenticate JWT token if it is present.
    async (req: Request, res: Response, next: NextFunction) => {
      const token = jwtFromRequest(req);
      req.log.debug('[EXPRESS] Attempting authentication...', token);
      if (token)
        passport.authenticate('jwt', { session: false, failWithError: true })(
          req,
          res,
          next,
        );
      else next();

      req.log.debug(`Request made to ${req.method} ${req.originalUrl}`, {
        user: req.user
          ? {
              id: req.user.id,
              username: req.user.username,
            }
          : undefined,
        agent: req.useragent?.source,
      });
    },

    // Intercept Passport error and format it to look like one of our UnauthorizedError responses.
    (err: any, req: Request, _res: Response, next: NextFunction) => {
      req.log.warn(
        '[AUTH] Authentication failure: Invalid JSON Web Token.',
        err,
      );
      next();
    },
  );

  log.debug('[EXPRESS] Adding API routes...');
  configureRouting(app, log);

  return app;
}
