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

const log = createLogger(Config.logLevel);

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: (_origin, cb) => {
        cb(null, true);
      },
      credentials: true,
    },
    logger: new BunyanLoggerService(log),
  });

  app.use(compression());

  const templatesRoot = fileURLToPath(dirname(import.meta.url));
  log.debug(
    `Initializing Pug as the view engine with root path ${templatesRoot}`,
  );
  app.setBaseViewsDir(templatesRoot);
  app.setViewEngine('pug');

  app.use(helmet());

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
