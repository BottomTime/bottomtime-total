import {
  EmailOptions,
  EmailOptionsWithGlobals,
  EmailType,
} from '@bottomtime/common';

import Logger from 'bunyan';
import { readFile } from 'fs/promises';
import { render } from 'mustache';
import { resolve } from 'path';

import { Config } from '../config';
import { IMailClient } from './types';

export type Recipients = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
};

export class EmailService {
  private readonly templatesPath: string;

  private readonly templates: Record<EmailType, string> = {
    [EmailType.ResetPassword]: './reset-password.html',
    [EmailType.VerifyEmail]: './verify-email.html',
    [EmailType.Welcome]: './welcome.html',
  };

  constructor(
    private readonly mailClient: IMailClient,
    private readonly log: Logger,
  ) {
    const compiled = /.*\.js$/.test(__filename);
    this.templatesPath = resolve(
      __dirname,
      compiled ? '../templates' : '../../../dist/templates',
    );
  }

  private getFullEmailOptions(options: EmailOptions): EmailOptionsWithGlobals {
    const now = new Date();
    return {
      adminEmail: Config.adminEmail,
      baseUrl: Config.baseUrl,
      displayName: options.user.profile.name || `@${options.user.username}`,
      now,
      year: now.getFullYear(),
      ...options,
    };
  }

  private async loadTemplate(type: EmailType): Promise<string> {
    const path = resolve(this.templatesPath, this.templates[type]);
    return await readFile(path, 'utf8');
  }

  async generateMessageContent(options: EmailOptions): Promise<string> {
    this.log.info(`Rendering email from template (${options.type})...`);
    this.log.debug('Email options:', options);
    const locals = this.getFullEmailOptions(options);

    const template = await this.loadTemplate(options.type);
    return render(template, locals);
  }

  sendMail(recipients: Recipients, subject: string, body: string): void {
    this.mailClient
      .sendMail(recipients, subject, body)
      .then(() => {
        this.log.info('Email has been sent', {
          recipients,
          subject,
        });
      })
      .catch((error) => {
        this.log.error(error);
      });
  }

  async ping(): Promise<void> {
    await this.mailClient.ping();
  }
}
