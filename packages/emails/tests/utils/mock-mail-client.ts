import { MailRecipients } from '@bottomtime/common';

import { IMailClient } from '../../src/service/email';

export class MockMailClient implements IMailClient {
  readonly sentMail: Array<{
    recipients: MailRecipients;
    subject: string;
    body: string;
  }> = [];

  async ping(): Promise<void> {
    /* no-op */
  }

  async sendMail(
    recipients: MailRecipients,
    subject: string,
    body: string,
  ): Promise<void> {
    this.sentMail.push({ recipients, subject, body });
  }
}
