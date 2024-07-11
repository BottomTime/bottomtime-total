import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

import * as uuid from 'uuid';

import { Queue } from '../../../src/queue/queue';
import { QueueService } from '../../../src/queue/queue.service';

jest.mock('uuid');

describe('Queue Class', () => {
  let client: SQSClient;
  let service: QueueService;

  beforeAll(() => {
    client = new SQSClient();
    service = new QueueService(client);
  });

  it('will invoke the underlying SQS client', async () => {
    const dedupId = '194391f0-3230-4ac0-a484-20f9163bb975';
    const spy = jest.spyOn(client, 'send').mockResolvedValue({} as never);
    jest.spyOn(uuid, 'v4').mockReturnValue(dedupId);

    const queueUrl = 'https://example.com/queue';
    const payload = 'payload';

    const queue = new Queue(service, queueUrl);

    await queue.add(payload);

    expect(spy).toHaveBeenCalled();
    const command = spy.mock.lastCall![0] as SendMessageCommand;

    expect(command.input.MessageBody).toBe(payload);
    expect(command.input.QueueUrl).toBe(queueUrl);
    expect(command.input.MessageDeduplicationId).toBe(dedupId);
  });
});
