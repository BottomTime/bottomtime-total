import { edgeAuthorizer } from '@bottomtime/common';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { Config } from './config.mjs';
import { initDevServer } from './dev-server.mjs';
import { getLogger } from './logger.mjs';
import { initProdServer } from './prod-server.mjs';

const log = getLogger();

export async function createApp() {
  const app = express();

  app.use(compression());
  app.use(cookieParser());
  app.use(
    cors({
      origin: (_origin, cb) => {
        cb(null, true);
      },
      credentials: true,
    }),
  );
  app.use('/api', createProxyMiddleware({ target: Config.apiUrl }));
  app.use(edgeAuthorizer(Config.edgeAuth));

  // Global error handler needs to return something meaningful.
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  app.use((err, _req, res, _next) => {
    // TODO: Return a static error page instead.
    log.error(err);
    res.status(500).json(err);
  });

  log.debug('Starting server using ConfigCat SDK key:', Config.configCatSdkKey);

  if (Config.isProduction) {
    await initProdServer(app);
  } else {
    await initDevServer(app);
  }

  return app;
}
