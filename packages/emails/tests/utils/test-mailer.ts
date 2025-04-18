import { IMailClient, Recipients } from '../../src/service/email';

export interface MailMessage {
  recipients: Recipients;
  subject: string;
  body: string;
}

export class TestMailer implements IMailClient {
  private _sentMail: MailMessage[];

  constructor() {
    this._sentMail = [];
  }

  get sentMail(): readonly MailMessage[] {
    return [...this._sentMail];
  }

  clearMessages() {
    this._sentMail = [];
  }

  async sendMail(
    recipients: Recipients,
    subject: string,
    body: string,
  ): Promise<void> {
    this._sentMail.push({
      recipients,
      subject,
      body,
    });
  }

  ping(): Promise<void> {
    return Promise.resolve();
  }
}
