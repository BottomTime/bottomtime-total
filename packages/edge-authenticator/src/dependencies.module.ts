import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class DependenciesModule {
  static forRoot(): DynamicModule {
    return {
      module: DependenciesModule,
      providers: [
        {
          provide: DynamoDBClient,
          useFactory: () => new DynamoDBClient(),
        },
      ],
      exports: [DynamoDBClient],
    };
  }
}
