import { DeleteMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';

import { QueueReaderBatch } from '../../src/queue-reader-batch';
import { createQueueMessages } from '../utils';
import { TestLogger } from '../utils/test-logger';

const QueueUrl = 'http://localstack:4566/000000000000/the_queue';

describe('Queue reader batch class', () => {
  let client: SQSClient;
  let sqsSpy: jest.SpyInstance;

  beforeAll(() => {
    client = new SQSClient({});
  });

  beforeEach(() => {
    sqsSpy = jest.spyOn(client, 'send').mockResolvedValue({} as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will return IDs correctly', async () => {
    const diveSiteIds = [
      'b3c0a575-bb34-4c08-b2bd-6515063e36dd',
      'a0cdae13-f2bb-4f8c-ad90-cbc3c9cf0cb9',
    ];
    const operatorIds = [
      '035b74c5-2ddb-4d89-a4d3-36be7e4fcd42',
      'c29d932e-8da9-4aac-9894-34ecbf419742',
    ];

    const batch = new QueueReaderBatch(
      client,
      QueueUrl,
      TestLogger,
      createQueueMessages(1),
      operatorIds,
      diveSiteIds,
    );

    expect(batch.diveSiteIds).toEqual(diveSiteIds);
    expect(batch.operatorIds).toEqual(operatorIds);
  });

  it('will return hasEntries correctly', async () => {
    let batch = new QueueReaderBatch(
      client,
      QueueUrl,
      TestLogger,
      createQueueMessages(1),
      [],
      [],
    );
    expect(batch.hasEntries).toBe(true);

    batch = new QueueReaderBatch(client, QueueUrl, TestLogger, [], [], []);
    expect(batch.hasEntries).toBe(false);
  });

  it('will finalize messages', async () => {
    const messages = createQueueMessages(8);
    const batch = new QueueReaderBatch(
      client,
      QueueUrl,
      TestLogger,
      messages,
      [],
      [],
    );

    await batch.finalize();

    expect(sqsSpy).toHaveBeenCalledTimes(1);
    const command: DeleteMessageBatchCommand = sqsSpy.mock.calls[0][0];
    expect(command.input.QueueUrl).toBe(QueueUrl);
    expect(command.input.Entries).toEqual(
      messages.map((msg) => ({
        Id: msg.MessageId,
        ReceiptHandle: msg.ReceiptHandle,
      })),
    );
  });

  it('will finalize messages in batches', async () => {
    const messages = createQueueMessages(18);
    const batch = new QueueReaderBatch(
      client,
      QueueUrl,
      TestLogger,
      messages,
      [],
      [],
    );

    await batch.finalize();

    expect(sqsSpy).toHaveBeenCalledTimes(2);
    let command: DeleteMessageBatchCommand = sqsSpy.mock.calls[0][0];
    expect(command.input.QueueUrl).toBe(QueueUrl);
    expect(command.input.Entries).toEqual(
      messages.slice(0, 10).map((msg) => ({
        Id: msg.MessageId,
        ReceiptHandle: msg.ReceiptHandle,
      })),
    );

    command = sqsSpy.mock.calls[1][0];
    expect(command.input.QueueUrl).toBe(QueueUrl);
    expect(command.input.Entries).toEqual(
      messages.slice(10).map((msg) => ({
        Id: msg.MessageId,
        ReceiptHandle: msg.ReceiptHandle,
      })),
    );
  });

  it('will do nothing when finalizing an empty batch', async () => {
    const batch = new QueueReaderBatch(
      client,
      QueueUrl,
      TestLogger,
      [],
      [],
      [],
    );
    await batch.finalize();
    expect(sqsSpy).not.toHaveBeenCalled();
  });
});
