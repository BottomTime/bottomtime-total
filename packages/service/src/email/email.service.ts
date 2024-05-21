import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { readFile } from 'fs/promises';
import { render } from 'mustache';
import path from 'path';

import { User } from '../auth/user';
import { Config } from '../config';
import { IMailClient, MailClientService } from './interfaces';

export enum EmailType {
  ResetPassword = 'resetPassword',
  VerifyEmail = 'verifyEmail',
  Welcome = 'welcome',
}

type EmailGlobals = {
  adminEmail: string;
  baseUrl: string;
  displayName: string;
  now: Date;
  year: number;
};

type BaseEmailOptions = {
  title: string;
  subtitle?: string;
  user: User;
};

type ResetPasswordEmailOptions = {
  type: EmailType.ResetPassword;
  resetPasswordUrl: string;
};

type VerifyEmailOptions = {
  type: EmailType.VerifyEmail;
  verifyEmailUrl: string;
};

type WelcomeEmailOptions = {
  type: EmailType.Welcome;
  logsUrl: string;
  profileUrl: string;
  verifyEmailUrl: string;
};

export type EmailOptions = BaseEmailOptions &
  (ResetPasswordEmailOptions | VerifyEmailOptions | WelcomeEmailOptions);

type EmailOptionsWithGlobals = EmailOptions & EmailGlobals;

export type Recipients = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
};

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly log: Logger = new Logger(EmailService.name);
  private templates?: Record<EmailType, string>;

  constructor(
    @Inject(MailClientService) private readonly mailClient: IMailClient,
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

  async onModuleInit(): Promise<void> {
    const basePath = path.resolve(__dirname, '../../assets/templates');
    this.log.debug('Pre-loading email template files...');

    const [resetPassword, verifyEmail, welcome] = await Promise.all([
      readFile(path.resolve(basePath, 'reset-password.html'), 'utf8'),
      readFile(path.resolve(basePath, 'verify-email.html'), 'utf8'),
      readFile(path.resolve(basePath, 'welcome.html'), 'utf8'),
    ]);

    this.log.debug('Email templates have been cached.');
    this.templates = {
      [EmailType.ResetPassword]: resetPassword,
      [EmailType.VerifyEmail]: verifyEmail,
      [EmailType.Welcome]: welcome,
    };
  }

  async generateMessageContent(options: EmailOptions): Promise<string> {
    if (!this.templates) {
      throw new Error('Module has not yet been initialized.');
    }

    this.log.debug(`Rendering email from template (${options.type})...`);
    this.log.verbose('Email options:', options);
    const locals = this.getFullEmailOptions(options);
    return render(this.templates[options.type], locals);
  }

  sendMail(recipients: Recipients, subject: string, body: string): void {
    this.mailClient
      .sendMail(recipients, subject, body)
      .then(() => {
        this.log.debug('Email has been sent', {
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
