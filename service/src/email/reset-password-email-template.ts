import path from 'path';
import { BaseTemplateData, HtmlTemplate } from './interfaces';

export interface ResetPasswordEmailTemplateData extends BaseTemplateData {
  resetToken: string;
}

export class ResetPasswordEmailTemplate extends HtmlTemplate<ResetPasswordEmailTemplateData> {
  protected title = 'Reset Your Password';
  protected templateFile = path.resolve(
    __dirname,
    './templates/reset-email-template.pug',
  );

  async render(data: ResetPasswordEmailTemplateData): Promise<string> {
    const { baseUrl } = this.globals();

    const searchParams = new URLSearchParams({
      token: data.resetToken,
    });
    const resetPasswordUrl = new URL(
      `/verifyEmail?${searchParams.toString()}`,
      baseUrl,
    );

    return super.doRender({
      ...data,
      resetPasswordUrl,
    });
  }
}
