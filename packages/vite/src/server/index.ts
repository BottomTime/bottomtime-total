import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { Config } from './config';
import { BunyanLoggerService, createLogger } from '@bottomtime/common';

const log = createLogger(Config.logLevel);

async function createApp(): Promise<INestApplication> {
  // const logService = new BunyanLoggerService(log);
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (_origin, cb) => {
        cb(null, true);
      },
      credentials: true,
    },
    // logger: logService,
  });
  return app;
}

createApp()
  .then((app) => app.listen(Config.port))
  .then(() => {
    // log.info(
    //   `🎉 Service has successfully started and is listening on port ${Config.port}. 🎉`,
    // );
  })
  .catch((error) => {
    // log.fatal('[SERVICE] Failed to start service... Shutting down...', error);
    process.exit(1);
  });
