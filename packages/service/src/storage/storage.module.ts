import { S3Client } from '@aws-sdk/client-s3';
import { DynamicModule, Module } from '@nestjs/common';

import { S3ClientKey, StorageService } from './storage.service';

@Module({})
export class StorageModule {
  private static s3Client: S3Client | undefined;
  private static baseModule: Partial<DynamicModule> = {
    imports: [],
    providers: [
      {
        provide: S3ClientKey,
        useFactory: () => {
          if (!StorageModule.s3Client) {
            throw new Error(
              'S3 client not initialized. Did you remember to call StorageModule.forRoot()?',
            );
          }
          return StorageModule.s3Client;
        },
      },
      StorageService,
    ],
    exports: [StorageService],
  };

  static forRoot(s3Client: S3Client): DynamicModule {
    StorageModule.s3Client = s3Client;
    return {
      module: StorageModule,
      ...StorageModule.baseModule,
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: StorageModule,
      ...StorageModule.baseModule,
    };
  }
}
