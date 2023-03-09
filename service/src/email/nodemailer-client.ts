import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { MailClient, MailRecipients } from './interfaces';

export class NodemailerClient implements MailClient {
  constructor(
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>,
  ) {}

  async sendMail(
    recipients: MailRecipients,
    subject: string,
    body: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      to: recipients.to,
      cc: recipients.cc,
      bcc: recipients.bcc,
      subject,
      html: body,
    });
  }
}
