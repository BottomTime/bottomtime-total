import type bunyan from 'bunyan';
import { MongoClient } from 'mongodb';

import config from '../config';
import { UserManager } from '../users';
import { DefaultUserManager } from '../users/default-user-manager';

export interface ServerDependencies {
  log: bunyan;
  mongoClient: MongoClient;
  userManager: UserManager;
}

export async function createDependencies(
  log: bunyan,
): Promise<ServerDependencies> {
  const mongoClient = await MongoClient.connect(config.mongoUri);

  const userManager = new DefaultUserManager(mongoClient, log);

  return {
    log,
    mongoClient,
    userManager,
  };
}
