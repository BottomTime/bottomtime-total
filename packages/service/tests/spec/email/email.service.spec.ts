/* eslint-disable no-process-env */
import { EmailOptions, EmailService, EmailType } from '../../../src/email';
import { UserData, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users/user';

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

  beforeAll(() => {
    oldEnv = Object.assign({}, process.env);
    process.env.BT_ADMIN_EMAIL = 'admin@bottomti.me';
    process.env.BT_BASE_URL = 'https://bottomti.me/';
  });

  beforeEach(() => {
    service = new EmailService();
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
});
