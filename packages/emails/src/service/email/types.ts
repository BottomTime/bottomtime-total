import { MailRecipients } from '@bottomtime/common';

export interface IMailClient {
  ping(): Promise<void>;
  sendMail(
    recipients: MailRecipients,
    subject: string,
    body: string,
  ): Promise<void>;
}
