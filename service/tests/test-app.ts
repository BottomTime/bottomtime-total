import { Express } from 'express';

import { createServer } from '../src/server/create-server';
import { createTestLogger } from './test-logger';
import { DefaultUserManager } from '../src/users/default-user-manager';
import { mongoClient as globalMongoClient } from './mongo-client';
import { ServerDependencies } from '../src/server/dependencies';

export async function createTestServer(
  deps?: Partial<ServerDependencies>,
): Promise<Express> {
  const log = deps?.log ?? createTestLogger('test-application');
  const mongoClient = deps?.mongoClient ?? globalMongoClient;
  const userManager =
    deps?.userManager ?? new DefaultUserManager(mongoClient, log);

  const fullDeps: ServerDependencies = {
    log,
    mongoClient,
    userManager,
  };

  const app = await createServer(async () => fullDeps);

  return app;
}
