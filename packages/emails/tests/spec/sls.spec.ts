import { Context, SQSEvent } from 'aws-lambda';

import * as mailClient from '../../src/service/email/nodemailer-client';
import * as logger from '../../src/service/logger';
import { handler } from '../../src/service/sls';
import Messages from '../fixtures/messages.json';
import { Log } from '../utils';
import { MockMailClient } from '../utils/mock-mail-client';

jest.mock('../../src/service/logger');
jest.mock('../../src/service/email/nodemailer-client');

describe('Servless Handler', () => {
  let messages: SQSEvent;
  let client: MockMailClient;

  beforeAll(() => {
    messages = Messages;
    client = new MockMailClient();
    jest.mocked(logger.createLogger).mockImplementation(() => Log);
    jest.mocked(mailClient.createMailClient).mockReturnValueOnce(client);
    jest.useFakeTimers({
      now: new Date('2024-07-23T12:52:10Z'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will handle a number of records', async () => {
    jest.mocked(mailClient.createMailClient).mockReturnValueOnce(client);
    const cb = jest.fn();
    const result = await handler(messages, {} as Context, cb);
    expect(result).toEqual({
      batchItemFailures: [],
    });
    expect(client.sentMail).toMatchSnapshot();
    expect(cb).not.toHaveBeenCalled();
  });

  it('will report failures if an error occurs while sending an email', async () => {
    jest.spyOn(client, 'sendMail').mockRejectedValue(new Error('dafuq?'));
    jest.spyOn(client, 'sendMail').mockImplementation(async (recipients) => {
      if (recipients.to === 'sally@email.org') throw new Error('nope');
    });

    const cb = jest.fn();
    const result = await handler(messages, {} as Context, cb);
    expect(result).toEqual({
      batchItemFailures: [
        {
          itemIdentifier: '7f19129a-c36d-4c6c-8bfa-a2f1dc6ba0fd',
        },
      ],
    });
    expect(cb).not.toHaveBeenCalled();
  });
});
