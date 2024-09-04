import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';

import Logger from 'bunyan';
import { PollingMode, getClient } from 'configcat-node';
import Stripe from 'stripe';

import { ServerDependencies } from './app.module';
import { BunyanLoggerService } from './bunyan-logger-service';
import { Config } from './config';
import { PostgresDataSourceOptions } from './data-source';

export async function createDependencies(
  log: Logger,
): Promise<ServerDependencies> {
  log.debug('Initializing AWS SQS client...', {
    endpoint: Config.aws.sqs.endpoint || '<default>',
    region: Config.aws.region,
  });
  const sqsClient = new SQSClient({
    region: Config.aws.region,
  });

  log.debug('Initializing AWS S3 client', {
    endpoint: Config.aws.s3.endpoint || '<default>',
    region: Config.aws.region,
  });
  const s3Client = new S3Client({
    credentials: {
      accessKeyId: Config.aws.accessKeyId,
      secretAccessKey: Config.aws.secretAccessKey,
    },
    endpoint: Config.aws.s3.endpoint,
    forcePathStyle: !!Config.aws.s3.endpoint,
    region: Config.aws.region,
  });

  log.debug('Initializing ConfigCat client for feature flags...');
  const configCatClient = getClient(
    Config.configCatSdkKey,
    PollingMode.AutoPoll,
    {
      logger: new BunyanLoggerService(log),
    },
  );

  log.debug('Initializing Stripe client...');
  const stripe = new Stripe(Config.stripe.sdkKey);

  return {
    configCatClient,
    dataSource: PostgresDataSourceOptions,
    s3Client,
    sqsClient,
    stripe,
  };
}
