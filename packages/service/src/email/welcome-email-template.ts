import path from 'path';
import { URL } from 'url';
import { BaseTemplateData, HtmlTemplate } from './interfaces';

export interface WelcomeEmailTemplateData extends BaseTemplateData {
  verifyEmailToken: string;
}

export class WelcomeEmailTemplate extends HtmlTemplate<WelcomeEmailTemplateData> {
  protected title = 'Welcome to Bottom Time!';
  protected templateFile = path.resolve(
    __dirname,
    './templates/welcome-email-template.pug',
  );

  render(data: WelcomeEmailTemplateData): Promise<string> {
    const { baseUrl } = this.globals();
    const searchParams = new URLSearchParams({
      email: data.user.email!,
      token: data.verifyEmailToken,
    });
    const verifyEmailUrl = new URL(
      `/verifyEmail?${searchParams.toString()}`,
      baseUrl,
    );
    const profileUrl = new URL('/profile', baseUrl);
    const logsUrl = new URL('/logs', baseUrl);

    return this.doRender({
      ...data,
      logsUrl,
      profileUrl,
      verifyEmailUrl,
    });
  }
}
