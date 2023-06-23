import { createTransport, SentMessageInfo } from 'nodemailer';
import { NodemailerClient } from '../../../src/email';

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

    const client = new NodemailerClient(transport, from, replyTo);
    await client.sendMail({ to, cc, bcc }, subject, body);

    expect(spy).toBeCalledWith({
      from,
      replyTo,
      bcc: 'spy-stuff@nsa.gov',
      cc: 'admin@some-isp.org',
      html: '<html><head><title>Hi!</title></head><body><p>What is up?</p></body></html>',
      subject: 'Important Email',
      to: ['greg@email.net', 'Brad <brad@email.org>'],
    });
  });
});
