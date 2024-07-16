import { createLogger } from '@bottomtime/common';

import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'reflect-metadata';

import { Config } from './config';
import { createApp } from './create-app';
import { createDependencies } from './create-dependencies';

dayjs.extend(tz);
dayjs.extend(utc);

const log = createLogger(Config.logLevel);

createApp(log, createDependencies)
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
