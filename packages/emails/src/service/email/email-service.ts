import {
  EmailOptions,
  EmailOptionsWithGlobals,
  EmailType,
} from '@bottomtime/common';

import Logger from 'bunyan';
import { render } from 'mustache';

import ResetPasswordTemplate from '../../../dist/templates/reset-password.html';
import VerifyEmailTemplate from '../../../dist/templates/verify-email.html';
import WelcomeTemplate from '../../../dist/templates/welcome.html';
import { Config } from '../config';
import { IMailClient } from './types';

export type Recipients = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
};

export class EmailService {
  private readonly templates: Record<EmailType, string> = {
    [EmailType.ResetPassword]: ResetPasswordTemplate,
    [EmailType.VerifyEmail]: VerifyEmailTemplate,
    [EmailType.Welcome]: WelcomeTemplate,
  };
  constructor(
    private readonly mailClient: IMailClient,
    private readonly log: Logger,
  ) {}

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

  async generateMessageContent(options: EmailOptions): Promise<string> {
    this.log.info(`Rendering email from template (${options.type})...`);
    this.log.debug('Email options:', options);
    const locals = this.getFullEmailOptions(options);
    return render(this.templates[options.type], locals);
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
