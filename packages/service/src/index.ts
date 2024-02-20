import { createLogger } from '@bottomtime/common/src/logger';

import { S3Client } from '@aws-sdk/client-s3';

import { createTransport } from 'nodemailer';

import { ServerDependencies } from './app.module';
import { Config } from './config';
import { createApp } from './create-app';
import { NodemailerClient } from './email';

const log = createLogger(Config.logLevel);

async function createDependencies(): Promise<ServerDependencies> {
  const transportOptions = {
    host: Config.mail.host,
    port: Config.mail.port,
    secure: true,
    auth: {
      user: Config.mail.username,
      pass: Config.mail.password,
    },
  };

  log.debug('Creating mail transport...', {
    ...transportOptions,
    auth: '**REDACTED**',
  });
  const transporter = createTransport(transportOptions);
  const mailClient = new NodemailerClient(
    transporter,
    Config.mail.from,
    Config.mail.replyTo,
  );

  const s3Client = new S3Client({
    region: Config.aws.region,
    logger: log,
  });

  return { mailClient, s3Client };
}

createApp(log, createDependencies)
  .then((app) => app.listen(Config.port))
  .then(() => {
    log.info(
      `🎉 Service has successfully started and is listening on port ${Config.port}. 🎉`,
    );
  })
  .catch((error) => {
    log.fatal('[SERVICE] Failed to start service... Shutting down...', error);
    process.exit(1);
  });
