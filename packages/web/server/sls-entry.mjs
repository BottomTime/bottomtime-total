import serverless from '@codegenie/serverless-express';

import { getLogger } from './logger.mjs';
import { createApp } from './server.mjs';

const log = getLogger();
let cachedServer;

async function init() {
  if (!cachedServer) {
    const app = await createApp();
    cachedServer = serverless({ app });
  }
}

export const handler = async (event, context) => {
  await init();
  log.trace('Raw request:', event);
  return await cachedServer(event, context);
};
