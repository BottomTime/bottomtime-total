import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { Config } from './config';
import { BunyanLoggerService, createLogger } from '@bottomtime/common';
import { createServer, ViteDevServer } from 'vite';

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

  const app = await NestFactory.create(AppModule.forRoot({ vite }), {
    cors: {
      origin: (_origin, cb) => {
        cb(null, true);
      },
      credentials: true,
    },
    logger: new BunyanLoggerService(log),
  });

  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': ["'self'", "'unsafe-inline'", 'kit.fontawesome.com'],
          'connect-src': ["'self'", 'ws:', 'ka-f.fontawesome.com'],
        },
      },
    }),
  );

  if (vite) app.use(vite.middlewares);

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
