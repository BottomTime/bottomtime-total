import { SQSClient } from '@aws-sdk/client-sqs';
import { Test } from '@nestjs/testing';

import { QueueModule } from '../../../src/queue';

describe('Queue Service', () => {
  let client: SQSClient;

  beforeAll(() => {
    client = new SQSClient();
  });

  it('will instantiate!', async () => {});
});
