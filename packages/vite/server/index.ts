import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { AppModule } from './app.module';
import { Config } from './config';
import { BunyanLoggerService, createLogger } from '@bottomtime/common';
import { ViteDevServer } from 'vite';

const log = createLogger(Config.logLevel);

async function createApp(): Promise<INestApplication> {
  let vite: ViteDevServer | undefined;
  if (!Config.isProduction) {
    log.debug('Initializing Vite dev server...');
    vite = await import('vite').then((v) =>
      v.createServer({
        server: {
          middlewareMode: true,
        },
        appType: 'custom',
        base: '/',
      }),
    );
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.forRoot({ vite }),
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

  if (vite) app.use(vite.middlewares);

  app.use(compression());

  const templatesRoot = fileURLToPath(dirname(import.meta.url));
  log.debug(
    `Initializing Pug as the view engine with root path ${templatesRoot}`,
  );
  app.setBaseViewsDir(templatesRoot);
  app.setViewEngine('pug');

  // app.use(helmet());

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
