import fs from 'fs/promises';
import path from 'path';
import pug, { compileTemplate } from 'pug';

import { BasicTemplateData, HtmlTemplate } from './interfaces';

export interface ResetEmailTemplateData extends BasicTemplateData {
  resetToken: string;
}

export class ResetEmailTemplate
  implements HtmlTemplate<ResetEmailTemplateData>
{
  private constructor(private readonly template: compileTemplate) {}

  render(data: ResetEmailTemplateData): string {
    return this.template(data);
  }

  static async create(): Promise<ResetEmailTemplate> {
    const source = await fs.readFile(
      path.resolve(__dirname, './reset-email-template.pug'),
      { encoding: 'utf-8' },
    );
    return new ResetEmailTemplate(pug.compile(source));
  }
}
