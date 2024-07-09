export type MailRecipients = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
};

export interface IMailClient {
  ping(): Promise<void>;
  sendMail(
    recipients: MailRecipients,
    subject: string,
    body: string,
  ): Promise<void>;
}
