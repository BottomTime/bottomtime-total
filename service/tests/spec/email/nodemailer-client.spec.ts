import { createTransport, SentMessageInfo } from 'nodemailer';
import { NodemailerClient } from '../../../src/email';

describe('Nodemailer Client', () => {
  it('Will send an email message correctly', async () => {
    const to = ['greg@email.net', 'Brad <brad@email.org>'];
    const cc = 'admin@some-isp.org';
    const bcc = 'spy-stuff@nsa.gov';
    const subject = 'Important Email';
    const body =
      '<html><head><title>Hi!</title></head><body><p>What is up?</p></body></html>';

    const transport = createTransport({
      host: 'smtp.mail.org',
      from: 'us@bottomti.me',
      replyTo: 'donotreply@bottomti.me',
    });
    const spy = jest
      .spyOn(transport, 'sendMail')
      .mockResolvedValue({} as SentMessageInfo);

    const client = new NodemailerClient(transport);
    await client.sendMail({ to, cc, bcc }, subject, body);

    expect(spy).toBeCalledWith({
      bcc: 'spy-stuff@nsa.gov',
      cc: 'admin@some-isp.org',
      html: '<html><head><title>Hi!</title></head><body><p>What is up?</p></body></html>',
      subject: 'Important Email',
      to: ['greg@email.net', 'Brad <brad@email.org>'],
    });
  });
});
