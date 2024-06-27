import serverless from '@codegenie/serverless-express';

import { createApp } from './server.mjs';

let cachedServer;

async function init() {
  if (!cachedServer) {
    const app = await createApp();
    cachedServer = serverless({ app });
  }
}

export const handler = async (event, context, cb) => {
  await init();
  return cachedServer(event, context, cb);
};
