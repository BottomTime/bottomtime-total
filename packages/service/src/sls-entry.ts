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
    const app = await createApp(logger, createDependencies);
    cachedServer = serverless({ app: app.getHttpAdapter().getInstance() });
  }
}

export const handler: Handler = async (
  event: unknown,
  context: Context,
  cb: Callback,
): Promise<void> => {
  await init();
  cachedServer(event, context, cb);
};
