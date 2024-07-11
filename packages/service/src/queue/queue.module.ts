import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamicModule, Module } from '@nestjs/common';

import { Queue } from './queue';
import { QueueOptions } from './queue-options';
import { QueueService } from './queue.service';

@Module({
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {
  static forRoot(client?: SQSClient, ...queues: QueueOptions[]): DynamicModule {
    client = client ?? new SQSClient();

    const service = new QueueService(client);
    const providers = queues.map((queue) => ({
      provide: queue.key,
      useFactory: () => new Queue(service, queue.queueUrl),
    }));

    return {
      module: QueueModule,
      global: true,
      providers: [
        {
          provide: QueueService,
          useValue: service,
        },
        ...providers,
      ],
      exports: providers,
    };
  }
}
