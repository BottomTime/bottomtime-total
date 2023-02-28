import type bunyan from 'bunyan';
import { MongoClient } from 'mongodb';

import config from '../config';

export interface ServerDependencies {
  log: bunyan;
  mongoClient: MongoClient;
}

export async function createDependencies(
  log: bunyan,
): Promise<ServerDependencies> {
  const mongoClient = await MongoClient.connect(config.mongoUri);

  return {
    log,
    mongoClient,
  };
}
