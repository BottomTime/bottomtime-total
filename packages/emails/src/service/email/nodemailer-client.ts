import { MailRecipients } from '@bottomtime/common';

import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { IMailClient } from './types';

class NodemailerClient implements IMailClient {
  constructor(
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>,
    private readonly fromAddress: string,
    private readonly replyToAddress: string,
  ) {}

  async ping(): Promise<void> {
    await this.transporter.verify();
  }

  async sendMail(
    recipients: MailRecipients,
    subject: string,
    body: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      replyTo: this.replyToAddress,
      to: recipients.to,
      cc: recipients.cc,
      bcc: recipients.bcc,
      subject,
      html: body,
    });
  }
}

export function createMailClient(
  transporter: Transporter<SMTPTransport.SentMessageInfo>,
  fromAddress: string,
  replyToAddress: string,
): IMailClient {
  return new NodemailerClient(transporter, fromAddress, replyToAddress);
}
