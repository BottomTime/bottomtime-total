import { createLogger } from '@bottomtime/common';

import { SQSHandler } from 'aws-lambda';
import Logger from 'bunyan';
import { createTransport } from 'nodemailer';

import { Config } from './config';
import { EmailService, NodemailerClient } from './email';

let log: Logger;
let service: EmailService;

async function init(): Promise<EmailService> {
  if (service) return service;

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
  const client = new NodemailerClient(
    transporter,
    Config.mail.from,
    Config.mail.replyTo,
  );
  service = new EmailService(client, log);
  return service;
}

export const handler: SQSHandler = async (event, context) => {
  const service = await init();
  for (const record of event.Records) {
    console.log(record.body);
  }
};
