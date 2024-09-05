import { DynamicModule, Module } from '@nestjs/common';

import { AWSModule } from '../dependencies';
import { Queue } from './queue';
import { QueueOptions } from './queue-options';
import { QueueService } from './queue.service';

@Module({})
export class QueueModule {
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [AWSModule],
      providers: [QueueService],
      exports: [QueueService],
    };
  }

  static forFeature(...queues: QueueOptions[]): DynamicModule {
    const root = QueueModule.forRoot();

    return {
      ...root,
      providers: [
        QueueService,
        ...queues.map((queue) => ({
          provide: queue.key,
          inject: [QueueService],
          useFactory(service: QueueService) {
            return new Queue(service, queue.queueUrl);
          },
        })),
      ],
      exports: [QueueService, ...queues.map((queue) => queue.key)],
    };
  }
}
