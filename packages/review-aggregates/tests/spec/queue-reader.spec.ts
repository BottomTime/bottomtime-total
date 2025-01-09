import { Message, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

import { QueueReader } from '../../src/queue-reader';
import { createQueueMessages } from '../utils';
import { TestLogger } from '../utils/test-logger';

const QueueUrl = 'http://localstack:4566/000000000000/the_queue';

describe('Queue reader class', () => {
  let client: SQSClient;
  let queueReader: QueueReader;

  let sqsSpy: jest.SpyInstance;

  beforeAll(() => {
    client = new SQSClient({});
    queueReader = new QueueReader(client, TestLogger, QueueUrl);
  });

  beforeEach(() => {
    sqsSpy = jest.spyOn(client, 'send');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will retrieve messages from the queue', async () => {
    const messages = createQueueMessages(6);
    sqsSpy.mockResolvedValueOnce({ Messages: messages });
    sqsSpy.mockResolvedValueOnce({ Messages: [] });

    const expected = {
      diveSiteIds: new Array<string>(),
      operatorIds: new Array<string>(),
    };
    messages.forEach((msg) => {
      const body = JSON.parse(msg.Body!);
      if (body.entity === 'diveSite') {
        expected.diveSiteIds.push(body.id);
      }
      if (body.entity === 'operator') {
        expected.operatorIds.push(body.id);
      }
    });

    const result = await queueReader.getBatch();
    expect(result.diveSiteIds).toEqual(expected.diveSiteIds);
    expect(result.operatorIds).toEqual(expected.operatorIds);
  });

  it('will de-dupe IDs from messages', async () => {
    const id = 'b7ac5bc8-d2ea-443f-9979-c57abc8edfa6';
    const messages = createQueueMessages(4);
    messages[0].Body = JSON.stringify({
      entity: 'diveSite',
      id,
    });
    messages[1].Body = JSON.stringify({
      entity: 'diveSite',
      id,
    });
    messages[2].Body = JSON.stringify({
      entity: 'operator',
      id,
    });
    messages[3].Body = JSON.stringify({
      entity: 'operator',
      id,
    });
    sqsSpy.mockResolvedValueOnce({ Messages: messages });
    sqsSpy.mockResolvedValueOnce({ Messages: [] });

    const expected = {
      diveSiteIds: [id],
      operatorIds: [id],
    };

    const result = await queueReader.getBatch();
    expect(result.diveSiteIds).toEqual(expected.diveSiteIds);
    expect(result.operatorIds).toEqual(expected.operatorIds);
  });

  it('will retrieve multiple batches of messages', async () => {
    const messages = createQueueMessages(16);
    sqsSpy.mockResolvedValueOnce({ Messages: messages.slice(0, 10) });
    sqsSpy.mockResolvedValueOnce({ Messages: messages.slice(10) });
    sqsSpy.mockResolvedValueOnce({ Messages: [] });

    const expected = {
      diveSiteIds: new Array<string>(),
      operatorIds: new Array<string>(),
    };
    messages.forEach((msg) => {
      const body = JSON.parse(msg.Body!);
      if (body.entity === 'diveSite') {
        expected.diveSiteIds.push(body.id);
      }
      if (body.entity === 'operator') {
        expected.operatorIds.push(body.id);
      }
    });

    const result = await queueReader.getBatch();
    expect(result.diveSiteIds).toEqual(expected.diveSiteIds);
    expect(result.operatorIds).toEqual(expected.operatorIds);
  });

  it('will max out at 200 messages per batch', async () => {
    sqsSpy.mockImplementation(
      async (): Promise<{ Messages: Message[] }> => ({
        Messages: createQueueMessages(10),
      }),
    );
    await queueReader.getBatch();
    expect(sqsSpy).toHaveBeenCalledTimes(20);
  });

  it('will not retrieve messages from the queue if the queue is empty', async () => {
    queueReader = new QueueReader(client, TestLogger, QueueUrl);
    sqsSpy.mockResolvedValue({ Messages: [] });

    const result = await queueReader.getBatch();
    expect(result.diveSiteIds).toHaveLength(0);
    expect(result.operatorIds).toHaveLength(0);

    expect(sqsSpy).toHaveBeenCalledTimes(1);

    const command: ReceiveMessageCommand = sqsSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(ReceiveMessageCommand);
    expect(command.input.QueueUrl).toBe(QueueUrl);
    expect(command.input.MaxNumberOfMessages).toBe(10);
  });

  it('will skip queue messages if the body cannot be parsed', async () => {
    const messages = createQueueMessages(3);
    messages[0].Body = undefined;
    messages[1].Body = 'invalid json';
    messages[2].Body = JSON.stringify({ entity: 'invalid' });

    sqsSpy.mockResolvedValueOnce({ Messages: messages });
    sqsSpy.mockResolvedValueOnce({ Messages: [] });

    const batch = await queueReader.getBatch();

    expect(batch.diveSiteIds).toHaveLength(0);
    expect(batch.operatorIds).toHaveLength(0);
  });
});
