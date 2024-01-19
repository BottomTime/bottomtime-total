import { Controller, Get, Inject, Logger, Res } from '@nestjs/common';
import { readFile } from 'fs/promises';
import Mustache from 'mustache';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { ViteService } from '.';
import { Config } from '../config';
import { Response } from 'express';
import { OriginalUrl } from '../original-url.decorator';
import { PageOptions } from '../constants';

@Controller('/')
export class ViteController {
  private readonly log = new Logger(ViteController.name);

  constructor(
    @Inject(ViteService)
    private readonly vite: ViteService,
  ) {}

  @Get('*')
  async render(
    @OriginalUrl() url: string,
    @Res() res: Response,
  ): Promise<void> {
    this.log.debug(`Handling render request for: ${url}`);

    const htmlTemplatePath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../index.html',
    );

    this.log.debug(`Reading HTML template from ${htmlTemplatePath}...`);
    const htmlTemplate = await readFile(htmlTemplatePath, 'utf-8');

    const html = await this.vite.transformHtml(url, htmlTemplate);
    this.log.verbose('Transformed HTML:', html);

    const rendered = await this.vite.render(url);
    this.log.verbose('Rendered Vue Content:', rendered.html);

    const opts: PageOptions = {
      appTitle: Config.appTitle,
      pageTitle: 'Home',
      head: rendered.head ?? '',
      content: rendered.html,
    };

    const content = Mustache.render(html, opts);
    res.set('Content-Type', 'text/html').send(content);
  }
}
