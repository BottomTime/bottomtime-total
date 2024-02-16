import { Controller, Get, Inject, Logger, Req, Res } from '@nestjs/common';

import { Request, Response } from 'express';
import { readFile } from 'fs/promises';
import Mustache from 'mustache';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { ViteService } from '.';
import { AppInitialState } from '../../src/common';
import { Config } from '../config';
import { PageOptions } from '../constants';
import { JwtService } from '../jwt';
import { OriginalUrl } from '../original-url.decorator';

@Controller('/')
export class ViteController {
  private readonly log = new Logger(ViteController.name);

  constructor(
    @Inject(ViteService)
    private readonly vite: ViteService,
    @Inject(JwtService)
    private readonly jwt: JwtService,
  ) {}

  @Get('*')
  async render(
    @OriginalUrl() url: string,
    @Req() req: Request,
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

    const authToken = this.jwt.extractJwtFromRequest(req);
    const initialState: AppInitialState = {
      currentUser: null,
    };

    const rendered = await this.vite.render(url, initialState, {
      authToken,
      baseURL: Config.apiUrl,
    });
    this.log.verbose('Rendered Vue Content:', rendered.html);

    const opts: PageOptions = {
      appTitle: Config.appTitle,
      pageTitle: 'Home',
      head: rendered.head ?? '',
      content: rendered.html,
      initialState: JSON.stringify(rendered.ctx),
    };

    const content = Mustache.render(html, opts);
    res.set('Content-Type', 'text/html').send(content);
  }
}
