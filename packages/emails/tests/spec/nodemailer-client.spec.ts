import { SentMessageInfo, createTransport } from 'nodemailer';

import { createMailClient } from '../../src/service/email';

describe('Nodemailer Client', () => {
  it('Will send an email message correctly', async () => {
    const from = 'us@bottomti.me';
    const replyTo = 'donotreply@bottomti.me';
    const to = ['greg@email.net', 'Brad <brad@email.org>'];
    const cc = 'admin@some-isp.org';
    const bcc = 'spy-stuff@nsa.gov';
    const subject = 'Important Email';
    const body =
      '<html><head><title>Hi!</title></head><body><p>What is up?</p></body></html>';

    const transport = createTransport({
      host: 'smtp.mail.org',
    });
    const spy = jest
      .spyOn(transport, 'sendMail')
      .mockResolvedValue({} as SentMessageInfo);

    const client = createMailClient(transport, from, replyTo);
    await client.sendMail({ to, cc, bcc }, subject, body);

    expect(spy).toHaveBeenCalledWith({
      from,
      replyTo,
      bcc: 'spy-stuff@nsa.gov',
      cc: 'admin@some-isp.org',
      html: '<html><head><title>Hi!</title></head><body><p>What is up?</p></body></html>',
      subject: 'Important Email',
      to: ['greg@email.net', 'Brad <brad@email.org>'],
    });
  });

  it('will ping the SMTP host', async () => {
    const from = 'us@bottomti.me';
    const replyTo = 'donotreply@bottomti.me';
    const transport = createTransport({
      host: 'smtp.mail.org',
    });
    const spy = jest.spyOn(transport, 'verify').mockResolvedValue(true);
    const client = createMailClient(transport, from, replyTo);

    await client.ping();

    expect(spy).toHaveBeenCalled();
  });
});
