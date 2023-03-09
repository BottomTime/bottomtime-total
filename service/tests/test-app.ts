import { Express } from 'express';

import { createServer } from '../src/server/create-server';
import { createTestLogger } from './test-logger';
import { DefaultUserManager } from '../src/users/default-user-manager';
import { mongoClient as globalMongoClient } from './mongo-client';
import { ServerDependencies } from '../src/server/dependencies';
import { TestMailer } from './utils/test-mailer';

export async function createTestServer(
  deps?: Partial<ServerDependencies>,
): Promise<Express> {
  const log = deps?.log ?? createTestLogger('test-application');
  const mongoClient = deps?.mongoClient ?? globalMongoClient;
  const userManager =
    deps?.userManager ?? new DefaultUserManager(mongoClient, log);
  const mail = deps?.mail ?? new TestMailer();

  const fullDeps: ServerDependencies = {
    log,
    mail,
    mongoClient,
    userManager,
  };

  const app = await createServer(() => Promise.resolve(fullDeps));

  return app;
}
