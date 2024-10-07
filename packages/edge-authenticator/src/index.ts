import serverless from '@codegenie/serverless-express';

import { Callback, Context, Handler } from 'aws-lambda';

import { createApp } from './app';
import { Config } from './config';
import { createLogger } from './logger';

const log = createLogger(Config.logLevel);
let cachedServer: Handler;

async function init(): Promise<void> {
  if (!cachedServer) {
    log.info('🚀 Initializing Edge Authorizer...');
    const app = await createApp(log);
    await app.init();
    cachedServer = serverless({ app: app.getHttpAdapter().getInstance() });
    log.info('🎉 Edge Authorizer is ready! 🎉');
  }
}

export const handler: Handler = async (
  event: unknown,
  context: Context,
  cb: Callback,
): Promise<unknown> => {
  try {
    await init();
    return await cachedServer(event, context, cb);
  } catch (error) {
    log.fatal(error);
    return { isAuthorized: false };
  }
};
