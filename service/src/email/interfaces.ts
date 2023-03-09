export interface BasicTemplateData {
  adminEmail: string;
  baseUrl: string;
  recipientEmail: string;
  recipientName: string;
  year: number;
}

export interface HtmlTemplate<TData extends BasicTemplateData> {
  render(data: TData): string;
}

export interface MailRecipients {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}

export interface MailClient {
  sendMail(
    recipients: MailRecipients,
    subject: string,
    body: string,
  ): Promise<void>;
}
