// import fs from 'fs/promises';
import {
  WelcomeEmailTemplate,
  WelcomeEmailTemplateData,
} from '../../../src/email/welcome-email-template';

describe('HTML Templates Rendering', () => {
  it('Will render welcome email', async () => {
    const data: WelcomeEmailTemplateData = {
      adminEmail: 'admin@bottomti.me',
      baseUrl: 'https://bottomti.me/',
      recipientEmail: 'bigmarco26@gmail.com',
      recipientName: 'Marco26',
      verifyEmailToken: 'Wruswiaq_iD5ujBZuSYTx-oxFzsqz6fj3iqWH3aT130',
      year: 2023,
    };

    const renderer = await WelcomeEmailTemplate.create();
    const content = renderer.render(data);
    expect(content).toMatchSnapshot();
  });
});
