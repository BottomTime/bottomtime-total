import { EmailOptions, EmailType } from '@bottomtime/common';

import { Config } from '../../src/service/config';
import { EmailService } from '../../src/service/email';
import { Log, TestMailer } from '../utils';

jest.mock('../../src/service/config');

const TestUserData = {
  username: 'MostExcellentUser33',
  email: 'totally_legit_user@gmail.com',
  profile: {
    name: 'John Diver',
  },
};

describe('Email Service', () => {
  let service: EmailService;
  let mailClient: TestMailer;

  const generateEmailTestCases: Record<EmailType, () => EmailOptions> = {
    [EmailType.PaymentFailed]: () => ({
      type: EmailType.PaymentFailed,
      title: 'Payment Failed',
      subtitle: 'Please update your payment information',
      user: TestUserData,
      paymentAmount: 'CAD$45.00',
      paymentDue: 'July 20, 2026',
      paymentUrl: 'https://bottomti.me/membership/confirmation',
    }),
    [EmailType.ResetPassword]: () => ({
      type: EmailType.ResetPassword,
      title: 'Reset Password',
      user: TestUserData,
      resetPasswordUrl: `https://bottomti.me/resetPassword?user=${TestUserData.username}&token=abcd-1234`,
    }),
    [EmailType.VerifyEmail]: () => ({
      type: EmailType.VerifyEmail,
      title: 'Verify Email',
      user: TestUserData,
      verifyEmailUrl: `https://bottomti.me/verifyEmail?user=${TestUserData.username}&token=abcd-1234`,
    }),
    [EmailType.Welcome]: () => ({
      type: EmailType.Welcome,
      title: 'Welcome to Bottom Time',
      subtitle: 'Get ready to dive in!',
      user: TestUserData,
      logsUrl: 'https://bottomti.me/logbook',
      profileUrl: 'https://bottomti.me/profile',
      verifyEmailUrl: `https://bottomti.me/verifyEmail?user=${TestUserData.username}&token=abcd-1234`,
    }),
  } as const;

  beforeAll(async () => {
    Config.adminEmail = 'admin@bottomti.me';
    Config.baseUrl = 'https://bottomti.me/';

    mailClient = new TestMailer();
    service = new EmailService(mailClient, Log);
  });

  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate'],
      now: new Date('2023-07-20T11:47:36.692Z'),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    mailClient.clearMessages();
  });

  Object.entries(generateEmailTestCases).forEach(([emailType, options]) => {
    it(`will generate ${emailType} email`, async () => {
      const email = await service.generateMessageContent(options());
      expect(email).toMatchSnapshot();
    });
  });

  it('will send a single email', async () => {
    const recipients = {
      to: ['mike@email.org', 'larry@email.org', 'sarah@email.org'],
    };
    const subject = 'Test Mail';
    const body = 'Hi mike! How is it hanging?';

    service.sendMail(recipients, subject, body);

    expect(mailClient.sentMail).toHaveLength(1);
    expect(mailClient.sentMail[0]).toEqual({
      recipients,
      subject,
      body,
    });
  });

  it('will invoke the client to ping the SMTP host', async () => {
    const spy = jest.spyOn(mailClient, 'ping');
    await service.ping();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
