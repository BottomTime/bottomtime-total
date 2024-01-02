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
