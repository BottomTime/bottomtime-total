import { EmailQueueMessage } from '@bottomtime/common';

import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import Logger from 'bunyan';
import { createTransport } from 'nodemailer';

import { Config } from './config';
import { EmailService, createMailClient } from './email';
import { createLogger } from './logger';

let log: Logger;
let service: EmailService;

async function init(): Promise<void> {
  if (service) return;

  log = createLogger(Config.logLevel);
  const transportOptions = {
    host: Config.mail.host,
    port: Config.mail.port,
    secure: true,
    auth: {
      user: Config.mail.username,
      pass: Config.mail.password,
    },
  };

  log.info('Creating mail transport...', {
    ...transportOptions,
    auth: '**REDACTED**',
  });
  const transporter = createTransport(transportOptions);
  const client = createMailClient(
    transporter,
    Config.mail.from,
    Config.mail.replyTo,
  );
  service = new EmailService(client, log);
}

export const handler: SQSHandler = async (event) => {
  try {
    await init();
  } catch (initError) {
    log.fatal(initError);
    throw initError;
  }

  const response: SQSBatchResponse = {
    batchItemFailures: [],
  };

  log.info(`Processing ${event.Records.length} messages...`);
  for (const record of event.Records) {
    try {
      const message: EmailQueueMessage = JSON.parse(record.body);
      log.info(`Processing message with ID "${record.messageId}"`);
      log.debug('Message options:', message);

      const content = await service.generateMessageContent(message.options);
      await service.sendMail(message.to, message.subject, content);
    } catch (error) {
      log.error(error);
      response.batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  return response;
};
