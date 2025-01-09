import { SQSClient } from '@aws-sdk/client-sqs';

import { Handler } from 'aws-lambda';
import { Client } from 'pg';

import { Aggregator } from './aggregator';
import { Config } from './config';
import { Logger } from './logger';
import { QueueReader } from './queue-reader';

const TenMinutes = 1000 * 60 * 10;

export const handler: Handler = async () => {
  const pgClient = new Client({
    connectionString: Config.postgresUri,
    ssl: Config.postgresRequireSsl,
  });
  const sqsClient = new SQSClient();

  await pgClient.connect();

  const queueReader = new QueueReader(sqsClient, Logger, Config.sqsQueueUrl);
  const aggregator = new Aggregator(pgClient, Logger);
  const stopTime = Date.now() + TenMinutes;

  // Run for no more than 10 minutes at a time
  while (Date.now() < stopTime) {
    const batch = await queueReader.getBatch();
    if (!batch.hasEntries) break;

    await aggregator.aggregate(batch);
    await batch.finalize();
  }
};
