import { User } from '../../../src/auth';
import { Config } from '../../../src/config';
import { UserEntity } from '../../../src/data';
import { EmailOptions, EmailService, EmailType } from '../../../src/email';
import { dataSource } from '../../data-source';
import { TestMailer, createTestUser } from '../../utils';

jest.mock('../../../src/config');

const TestUserData: Partial<UserEntity> = {
  username: 'MostExcellentUser33',
  email: 'totally_legit_user@gmail.com',
  name: 'John Diver',
};

describe('Email Service', () => {
  let user: User;

  let service: EmailService;
  let mailClient: TestMailer;

  const generateEmailTestCases: Record<EmailType, () => EmailOptions> = {
    [EmailType.ResetPassword]: () => ({
      type: EmailType.ResetPassword,
      title: 'Reset Password',
      user,
      resetPasswordUrl: `https://bottomti.me/resetPassword?user=${TestUserData.username}&token=abcd-1234`,
    }),
    [EmailType.VerifyEmail]: () => ({
      type: EmailType.VerifyEmail,
      title: 'Verify Email',
      user,
      verifyEmailUrl: `https://bottomti.me/verifyEmail?user=${TestUserData.username}&token=abcd-1234`,
    }),
    [EmailType.Welcome]: () => ({
      type: EmailType.Welcome,
      title: 'Welcome to Bottom Time',
      subtitle: 'Get ready to dive in!',
      user,
      logsUrl: 'https://bottomti.me/logbook',
      profileUrl: 'https://bottomti.me/profile',
      verifyEmailUrl: `https://bottomti.me/verifyEmail?user=${TestUserData.username}&token=abcd-1234`,
    }),
  } as const;

  beforeAll(async () => {
    Config.adminEmail = 'admin@bottomti.me';
    Config.baseUrl = 'https://bottomti.me/';

    const userData = createTestUser(TestUserData);
    user = new User(dataSource.getRepository(UserEntity), userData);

    mailClient = new TestMailer();
    service = new EmailService(mailClient);
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
});
