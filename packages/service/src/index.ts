import { ServerDependencies } from './app.module';
import { Config } from './config';
import { createApp } from './create-app';
import { NodemailerClient } from './email';
import { createLogger } from './logger';
import { createTransport } from 'nodemailer';

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

  return { mailClient };
}

createApp(log, createDependencies)
  .then(async (app) => {
    await app.listen(Config.port);

    log.info(
      `🎉 Service has successfully started and is listening on port ${Config.port}. 🎉`,
    );
  })
  .catch((error) => {
    log.fatal('[SERVICE] Failed to start service... Shutting down...', error);
    process.exit(1);
  });
