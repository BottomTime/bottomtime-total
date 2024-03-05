import { S3Client } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';

import path from 'path';

import { ServerDependencies } from '../../src/app.module';
import { createApp } from '../../src/create-app';
import { Log } from './test-logger';
import { TestMailer } from './test-mailer';

export async function createTestApp(
  deps: Partial<ServerDependencies> = {},
): Promise<INestApplication> {
  const app = await createApp(Log, async (): Promise<ServerDependencies> => {
    return {
      mailClient: deps.mailClient ?? new TestMailer(),
      s3Client: deps.s3Client ?? new S3Client({ region: 'us-east-1' }),
      dataSource: deps.dataSource ?? {
        type: 'postgres',
        url:
          process.env.BT_POSTGRES_TEST_URI ||
          'postgres://localhost:5432/bottomtime_test',
        entities: [path.resolve(__dirname, '../../src/data/**/*.entity.ts')],
      },
    };
  });
  await app.init();
  return app;
}
