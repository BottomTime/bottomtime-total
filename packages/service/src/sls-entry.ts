import serverless from '@codegenie/serverless-express';

import { Callback, Context, Handler } from 'aws-lambda';

import { Config } from './config';
import { createApp } from './create-app';
import { createDependencies } from './create-dependencies';
import { createLogger } from './logger';

const logger = createLogger(Config.logLevel);
let cachedServer: Handler;

async function init(): Promise<void> {
  if (!cachedServer) {
    const app = await createApp(logger, createDependencies);
    await app.init();
    cachedServer = serverless({ app: app.getHttpAdapter().getInstance() });
  }
}

export const handler: Handler = async (
  event: unknown,
  context: Context,
  cb: Callback,
): Promise<unknown> => {
  await init();
  return cachedServer(event, context, cb);
};
