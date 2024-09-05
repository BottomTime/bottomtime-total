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
    [EmailType.MembershipCanceled]: './membership-canceled.html',
    [EmailType.MembershipChanged]: './membership-changed.html',
    [EmailType.PaymentFailed]: './payment-failed.html',
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
    this.log.debug(`Loading email template from ${path}...`);
    return await readFile(path, 'utf8');
  }

  async generateMessageContent(options: EmailOptions): Promise<string> {
    this.log.info(`Rendering email from template (${options.type})...`);
    this.log.debug('Email options:', options);
    const locals = this.getFullEmailOptions(options);

    const template = await this.loadTemplate(options.type);
    return render(template, locals);
  }

  async sendMail(
    recipients: Recipients,
    subject: string,
    body: string,
  ): Promise<void> {
    this.log.info('Sending email...', recipients);
    await this.mailClient.sendMail(recipients, subject, body);
  }

  async ping(): Promise<void> {
    await this.mailClient.ping();
  }
}
