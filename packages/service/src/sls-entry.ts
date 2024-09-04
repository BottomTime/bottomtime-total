import serverless from '@codegenie/serverless-express';

import { Callback, Context, Handler } from 'aws-lambda';
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

const logger = createLogger(Config.logLevel);
let cachedServer: Handler;

async function init(): Promise<void> {
  if (!cachedServer) {
    logger.info('🚀 Initializing service...');
    const app = await createApp(AppModule, logger);
    await app.init();
    logger.info('🎉 Service is online! 🎉');
    cachedServer = serverless({ app: app.getHttpAdapter().getInstance() });
  }
}

export const handler: Handler = async (
  event: unknown,
  context: Context,
  cb: Callback,
): Promise<unknown> => {
  try {
    await init();
    return cachedServer(event, context, cb);
  } catch (error) {
    logger.fatal(error);
    cb(error as Error);
  }
};
