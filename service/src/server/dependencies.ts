import type bunyan from 'bunyan';
import { createTransport } from 'nodemailer';
import { MongoClient } from 'mongodb';

import config from '../config';
import { MailClient } from '../email';
import { NodemailerClient } from '../email/nodemailer-client';
import { UserManager } from '../users';
import { DefaultUserManager } from '../users/default-user-manager';
import { PreDefinedTankManager, TankManager } from '../tanks';

export interface ServerDependencies {
  log: bunyan;
  mail: MailClient;
  mongoClient: MongoClient;
  tankManager: TankManager;
  userManager: UserManager;
}

export async function createDependencies(
  log: bunyan,
): Promise<ServerDependencies> {
  const transportOptions = {
    host: config.mail.host,
    port: config.mail.port,
    secure: true,
    auth: {
      user: config.mail.username,
      pass: config.mail.password,
    },
  };

  log.debug('[EXPRESS] Creating mail transport', {
    ...transportOptions,
    auth: '**REDACTED**',
  });
  const transporter = createTransport(transportOptions);
  const mail = new NodemailerClient(
    transporter,
    config.mail.from,
    config.mail.replyTo,
  );
  const mongoClient = await MongoClient.connect(config.mongoUri);

  const tankManager = new PreDefinedTankManager(mongoClient, log);
  const userManager = new DefaultUserManager(mongoClient, log);

  return {
    log,
    mail,
    mongoClient,
    tankManager,
    userManager,
  };
}
