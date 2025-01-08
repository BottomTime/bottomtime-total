import { SQSClient } from '@aws-sdk/client-sqs';

import { Handler } from 'aws-lambda';
import { Client } from 'pg';

import { Aggregator } from './aggregator';
import { Config } from './config';
import { QueueReader } from './queue-reader';

export const handler: Handler = async () => {
  try {
    const pgClient = new Client({
      connectionString: Config.postgresUri,
      ssl: Config.postgresRequireSsl,
    });
    const sqsClient = new SQSClient();

    await pgClient.connect();

    const queueReader = new QueueReader(sqsClient, Config.sqsQueueUrl);
    const aggregator = new Aggregator(pgClient);
  } catch (error) {
    // TODO: Need to introduce a logger here.
  }
};
