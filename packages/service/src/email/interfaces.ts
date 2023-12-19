import { renderFile } from 'pug';
import { User } from '../users';
import config from '../config';

export interface BaseTemplateData {
  user: User;
}

export abstract class HtmlTemplate<TData extends BaseTemplateData> {
  protected abstract readonly title: string;
  protected abstract readonly templateFile: string;

  protected globals() {
    return {
      adminEmail: config.adminEmail,
      baseUrl: config.baseUrl,
      now: new Date(),
      title: this.title,
    };
  }

  protected async doRender(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      renderFile(
        this.templateFile,
        {
          ...data,
          ...this.globals(),
        },
        (error, html) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(html);
        },
      );
    });
  }

  abstract render(data: TData): Promise<string>;
}

export const MailClientService = Symbol('MAIL_CLIENT');

export type MailRecipients = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
};

export interface IMailClient {
  sendMail(
    recipients: MailRecipients,
    subject: string,
    body: string,
  ): Promise<void>;
}
