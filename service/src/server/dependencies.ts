import type bunyan from 'bunyan';
import { createTransport } from 'nodemailer';
import { MongoClient } from 'mongodb';

import config from '../config';
import { MailClient } from '../email';
import { NodemailerClient } from '../email/nodemailer-client';
import { UserManager } from '../users';
import { DefaultUserManager } from '../users/default-user-manager';

export interface ServerDependencies {
  log: bunyan;
  mail: MailClient;
  mongoClient: MongoClient;
  userManager: UserManager;
}

export async function createDependencies(
  log: bunyan,
): Promise<ServerDependencies> {
  const transporter = createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: true,
    auth: {
      user: config.mail.username,
      pass: config.mail.password,
    },
    from: config.mail.from,
    replyTo: config.mail.replyTo,
  });
  const mail = new NodemailerClient(transporter);
  const mongoClient = await MongoClient.connect(config.mongoUri);

  const userManager = new DefaultUserManager(mongoClient, log);

  return {
    log,
    mail,
    mongoClient,
    userManager,
  };
}
