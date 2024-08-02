import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { Config } from './config.mjs';
import { initDevServer } from './dev-server.mjs';
import { initProdServer } from './prod-server.mjs';

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

  // TODO: Global error handler needs to return something meaningful.
  // app.use((err, _req, res, _next) => {
  //   res.status(500).send(err);
  // });

  if (Config.isProduction) {
    await initProdServer(app);
  } else {
    await initDevServer(app);
  }

  return app;
}
