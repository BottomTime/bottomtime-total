import fs from 'fs/promises';
import path from 'path';
import pug, { compileTemplate } from 'pug';
import { URL } from 'url';

import { BasicTemplateData, HtmlTemplate } from './interfaces';

export interface WelcomeEmailTemplateData extends BasicTemplateData {
  verifyEmailToken: string;
}

export class WelcomeEmailTemplate
  implements HtmlTemplate<WelcomeEmailTemplateData>
{
  private constructor(private readonly template: compileTemplate) {}

  render(data: WelcomeEmailTemplateData): string {
    const searchParams = new URLSearchParams({
      email: data.recipientEmail,
      token: data.verifyEmailToken,
    });
    const verifyEmailUrl = new URL(
      `/verifyEmail?${searchParams.toString()}`,
      data.baseUrl,
    );
    const profileUrl = new URL('/profile', data.baseUrl);
    const logsUrl = new URL('/logs', data.baseUrl);

    return this.template({
      ...data,
      logsUrl,
      profileUrl,
      verifyEmailUrl,
    });
  }

  static async create(): Promise<WelcomeEmailTemplate> {
    const source = await fs.readFile(
      path.resolve(__dirname, './welcome-email-template.pug'),
      { encoding: 'utf-8' },
    );
    return new WelcomeEmailTemplate(pug.compile(source));
  }
}
