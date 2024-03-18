import { BunyanLoggerService, createLogger } from '@bottomtime/common';

import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { ViteDevServer, createServer } from 'vite';

import { AppModule } from './app.module';
import { Config } from './config';

const log = createLogger(Config.logLevel);

async function createApp(): Promise<INestApplication> {
  let vite: ViteDevServer | undefined;
  if (!Config.isProduction) {
    log.debug('Initializing Vite dev server...');
    vite = await createServer({
      server: {
        middlewareMode: true,
      },
      appType: 'custom',
      base: '/',
    });
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.forRoot(),
    {
      cors: {
        origin: (_origin, cb) => {
          cb(null, true);
        },
        credentials: true,
      },
      logger: new BunyanLoggerService(log),
    },
  );

  app.use(compression());
  app.use(cookieParser());
  app.use('/api', createProxyMiddleware({ target: Config.apiUrl }));

  if (vite) {
    app.use(vite.middlewares);
  } else {
    const staticAssetsPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../dist/client',
    );
    app.useStaticAssets(staticAssetsPath, {
      index: false,
    });
  }

  return app;
}

createApp()
  .then((app) => app.listen(Config.port))
  .then(() => {
    log.info(
      `🎉 Service has successfully started and is listening on port ${Config.port}. 🎉`,
    );
  })
  .catch((error) => {
    log.fatal('[SERVICE] Failed to start service... Shutting down...', error);
    process.exit(1);
  });
