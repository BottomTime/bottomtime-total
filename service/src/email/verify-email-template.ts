import fs from 'fs/promises';
import path from 'path';
import pug, { compileTemplate } from 'pug';

import { BaseTemplateData, HtmlTemplate } from './interfaces';

export interface VerifyEmailTemplateData extends BaseTemplateData {
  verifyEmailToken: string;
}

export class VerifyEmailTemplate extends HtmlTemplate<VerifyEmailTemplateData> {
  protected title = 'Verify Your Email Address';
  protected templateFile = path.resolve(
    __dirname,
    './templates/verify-email-template.pug',
  );

  render(data: VerifyEmailTemplateData): Promise<string> {
    const { baseUrl } = this.globals();

    const searchParams = new URLSearchParams({
      email: data.user.email ?? '',
      token: data.verifyEmailToken,
    });
    const verifyEmailUrl = new URL(
      `/verifyEmail?${searchParams.toString()}`,
      baseUrl,
    );

    return this.doRender({
      ...data,
      verifyEmailUrl,
    });
  }
}
