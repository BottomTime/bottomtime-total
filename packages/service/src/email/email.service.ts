import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { User } from '../users/user';
import { Config } from '../config';
import { compileFile, compileTemplate, Options } from 'pug';
import path from 'path';
import { IMailClient, MailClientService } from './interfaces';

export enum EmailType {
  ResetPassword = 'resetPassword',
  VerifyEmail = 'verifyEmail',
  Welcome = 'welcome',
}

type EmailGlobals = {
  adminEmail: string;
  baseUrl: string;
  now: Date;
};

type BaseEmailOptions = {
  title: string;
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
  private static readonly pugOptions: Options = {
    basedir: path.resolve(__dirname, '../../assets/templates'),
  } as const;

  private static readonly templatePaths: Record<EmailType, string> = {
    [EmailType.ResetPassword]: 'reset-email-template.pug',
    [EmailType.VerifyEmail]: 'verify-email-template.pug',
    [EmailType.Welcome]: 'welcome-email-template.pug',
  } as const;
  private readonly log: Logger = new Logger(EmailService.name);

  private templates: Record<EmailType, compileTemplate> | undefined;

  constructor(
    @Inject(MailClientService) private readonly mailClient: IMailClient,
  ) {}

  private preCompileTemplate(type: EmailType): compileTemplate {
    const basedir = path.resolve(__dirname, EmailService.pugOptions.basedir!);
    const filename = path.resolve(basedir, EmailService.templatePaths[type]);

    this.log.debug(`Pre-compiling email template for ${type} emails...`);
    const compiledTemplate = compileFile(filename, {
      basedir,
      filename,
    });

    return compiledTemplate;
  }

  private getFullEmailOptions(options: EmailOptions): EmailOptionsWithGlobals {
    return {
      adminEmail: Config.adminEmail,
      baseUrl: Config.baseUrl,
      now: new Date(),
      ...options,
    };
  }

  onModuleInit() {
    this.templates = {
      [EmailType.ResetPassword]: this.preCompileTemplate(
        EmailType.ResetPassword,
      ),
      [EmailType.VerifyEmail]: this.preCompileTemplate(EmailType.VerifyEmail),
      [EmailType.Welcome]: this.preCompileTemplate(EmailType.Welcome),
    };
  }

  async generateMessageContent(options: EmailOptions): Promise<string> {
    if (!this.templates) {
      throw new Error('Module has not yet been initialized.');
    }

    const locals = this.getFullEmailOptions(options);
    const html = this.templates[options.type](locals);
    return html;
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
      .catch(this.log.error);
  }
}
