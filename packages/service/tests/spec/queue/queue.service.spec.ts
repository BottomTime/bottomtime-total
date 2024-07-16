import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

import { QueueService } from '../../../src/queue/queue.service';

describe('Queue Service', () => {
  let client: SQSClient;
  let service: QueueService;

  beforeAll(() => {
    client = new SQSClient();
    service = new QueueService(client);
  });

  it('will invoke the underlying SQS client', async () => {
    const spy = jest.spyOn(client, 'send').mockResolvedValue({} as never);

    const queueUrl = 'https://example.com/queue';
    const payload = 'payload';

    await service.addMessage(queueUrl, payload);

    expect(spy).toHaveBeenCalled();
    const command = spy.mock.lastCall![0] as SendMessageCommand;

    expect(command.input.MessageBody).toBe(payload);
    expect(command.input.QueueUrl).toBe(queueUrl);
  });
});
