import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { INestApplication } from '@nestjs/common';

import path from 'path';
import Stripe from 'stripe';

import { ServerDependencies } from '../../src/app.module';
import { createApp } from '../../src/create-app';
import { PostgresUri } from '../postgres-uri';
import { ConfigCatClientMock } from './config-cat-client-mock';
import { Log } from './test-logger';

export async function createTestApp(
  deps: Partial<ServerDependencies> = {},
): Promise<INestApplication> {
  const app = await createApp(Log, async (): Promise<ServerDependencies> => {
    return {
      s3Client:
        deps.s3Client ??
        new S3Client({
          forcePathStyle: true,
          endpoint: 'http://localhost:4569/',
          region: 'us-east-1',
        }),
      sqsClient: deps.sqsClient ?? new SQSClient({ region: 'us-east-1' }),
      stripe: deps.stripe ?? new Stripe('sk_test_xxxxxx'),
      dataSource: deps.dataSource ?? {
        type: 'postgres',
        url: PostgresUri,
        entities: [path.resolve(__dirname, '../../src/data/**/*.entity.ts')],
      },
      configCatClient: deps.configCatClient ?? new ConfigCatClientMock(),
    };
  });

  return await app.init();
}
