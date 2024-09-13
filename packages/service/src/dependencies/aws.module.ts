import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Module } from '@nestjs/common';

import { Config } from '../config';

@Module({
  providers: [
    {
      provide: S3Client,
      useFactory() {
        return new S3Client({
          region: Config.aws.region,
          endpoint: Config.aws.s3.endpoint,
          forcePathStyle: !!Config.aws.s3.endpoint,
        });
      },
    },
    {
      provide: SQSClient,
      useFactory() {
        return new SQSClient({
          endpoint: Config.aws.sqs.endpoint,
          region: Config.aws.region,
        });
      },
    },
  ],
  exports: [S3Client, SQSClient],
})
export class AWSModule {}
