import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'reflect-metadata';

import { AppModule } from './app.module';
import { Config } from './config';
import { createApp } from './create-app';
import { createLogger } from './logger';

dayjs.extend(tz);
dayjs.extend(utc);

const log = createLogger(Config.logLevel);

createApp(AppModule, log)
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
