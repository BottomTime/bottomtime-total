import { createLogger } from '@bottomtime/common';

import serverless from '@codegenie/serverless-express';

import { Callback, Context, Handler } from 'aws-lambda';

import { Config } from './config';
import { createApp } from './create-app';
import { createDependencies } from './create-dependencies';

const logger = createLogger(Config.logLevel);
let cachedServer: Handler;

async function init(): Promise<void> {
  if (!cachedServer) {
    logger.info('🚀 Initializing service...');
    const app = await createApp(logger, createDependencies);
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
