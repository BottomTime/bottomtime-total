/* eslint-disable no-process-env */
import { EmailOptions, EmailService, EmailType } from '../../../src/email';
import { UserData, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';
import { TestMailer } from '../../utils';

const TestUserData: Partial<UserData> = {
  username: 'MostExcellentUser33',
  email: 'totally_legit_user@gmail.com',
};

describe('Email Service', () => {
  const user = new User(UserModel, new UserModel(TestUserData));
  const generateEmailTestCases: Record<EmailType, EmailOptions> = {
    [EmailType.ResetPassword]: {
      type: EmailType.ResetPassword,
      title: 'Reset Password',
      user,
      resetToken: 'abcd-1234',
    },
    [EmailType.VerifyEmail]: {
      type: EmailType.VerifyEmail,
      title: 'Verify Email',
      user,
      verifyEmailToken: 'abcd-1234',
    },
    [EmailType.Welcome]: {
      type: EmailType.Welcome,
      title: 'Welcome',
      user,
      verifyEmailToken: 'abcd-1234',
    },
  } as const;

  let oldEnv: object;
  let service: EmailService;
  let mailClient: TestMailer;

  beforeAll(() => {
    oldEnv = Object.assign({}, process.env);
    process.env.BT_ADMIN_EMAIL = 'admin@bottomti.me';
    process.env.BT_BASE_URL = 'https://bottomti.me/';
  });

  beforeEach(() => {
    mailClient = new TestMailer();
    service = new EmailService(mailClient);
    service.onModuleInit();
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate'],
      now: new Date('2023-07-20T11:47:36.692Z'),
    });
  });

  afterAll(() => {
    Object.assign(process.env, oldEnv);
  });

  Object.entries(generateEmailTestCases).forEach(([emailType, options]) => {
    it(`will generate ${emailType} email`, async () => {
      const email = await service.generateMessageContent(options);
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
