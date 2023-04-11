import {
  ResetPasswordEmailTemplate,
  ResetPasswordEmailTemplateData,
} from '../../../src/email';
import {
  VerifyEmailTemplate,
  VerifyEmailTemplateData,
} from '../../../src/email/verify-email-template';
import {
  WelcomeEmailTemplate,
  WelcomeEmailTemplateData,
} from '../../../src/email/welcome-email-template';
import { DefaultUser, User } from '../../../src/users';
import { fakeProfile, fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { createTestLogger } from '../../test-logger';

const Log = createTestLogger('email-templates');

describe('HTML Templates Rendering', () => {
  let oldEnv: object;
  let user: User;

  beforeAll(() => {
    const userData = fakeUser({
      username: 'Marco26',
      email: 'bigmarco26@gmail.com',
      profile: fakeProfile({
        name: 'Marco G.',
      }),
    });
    user = new DefaultUser(mongoClient, Log, userData);
    oldEnv = Object.assign({}, process.env);

    process.env.BT_ADMIN_EMAIL = 'admin@bottomti.me';
    process.env.BT_BASE_URL = 'https://bottomti.me/';

    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate'],
      now: new Date('2023-04-10T22:35:52.844Z'),
    });
  });

  afterAll(() => {
    jest.useRealTimers();
    Object.assign(process.env, oldEnv);
  });

  it('Will render welcome email', async () => {
    const data: WelcomeEmailTemplateData = {
      user,
      verifyEmailToken: 'Wruswiaq_iD5ujBZuSYTx-oxFzsqz6fj3iqWH3aT130',
    };

    const renderer = new WelcomeEmailTemplate();
    const content = await renderer.render(data);
    expect(content).toMatchSnapshot();
  });

  it('Will render verify email email', async () => {
    const data: VerifyEmailTemplateData = {
      user,
      verifyEmailToken: 'Wruswiaq_iD5ujBZuSYTx-oxFzsqz6fj3iqWH3aT130',
    };

    const renderer = new VerifyEmailTemplate();
    const content = await renderer.render(data);
    expect(content).toMatchSnapshot();
  });

  it('Will render reset password email', async () => {
    const data: ResetPasswordEmailTemplateData = {
      user,
      resetToken: 'Wruswiaq_iD5ujBZuSYTx-oxFzsqz6fj3iqWH3aT130',
    };

    const renderer = new ResetPasswordEmailTemplate();
    const content = await renderer.render(data);
    expect(content).toMatchSnapshot();
  });
});
