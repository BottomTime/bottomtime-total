import { S3Client } from '@aws-sdk/client-s3';
import { DynamicModule, Module } from '@nestjs/common';

import { S3ClientKey, StorageService } from './storage.service';

@Module({})
export class StorageModule {
  static forRoot(s3Client: S3Client): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        {
          provide: S3ClientKey,
          useValue: s3Client,
        },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}
