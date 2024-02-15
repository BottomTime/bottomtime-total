import { ApiClientOptions } from '@/client';
import { Controller, Get, Inject, Logger, Req, Res } from '@nestjs/common';

import { Request, Response } from 'express';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { AppInitialState } from '../../src/common';
import { Config } from '../config';
import { PageOptions } from '../constants';
import { JwtService } from '../jwt';
import { OriginalUrl } from '../original-url.decorator';
import { WebService } from './web.service';

@Controller()
export class WebController {
  private readonly log = new Logger(WebController.name);
  private readonly serverEntryPath: string;

  constructor(
    @Inject(WebService) private readonly service: WebService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {
    this.serverEntryPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../dist/server/entry-server.js',
    );
  }

  @Get('*')
  async index(
    @OriginalUrl() url: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.log.debug(`Handling render request for: ${url}`);

    const jwtToken = this.jwt.extractJwtFromRequest(req);
    const initialState: AppInitialState = {
      currentUser: null,
    };

    const clientOptions: ApiClientOptions = {
      authToken: jwtToken,
      baseURL: Config.apiUrl,
    };
    const { render: ssrRender } = await import(this.serverEntryPath);
    const {
      head,
      html: content,
      ctx,
    } = await ssrRender(url, initialState, clientOptions);
    this.log.verbose('Raw server-rendered Vue content:', content);

    const opts: PageOptions = {
      appTitle: 'Bottom Time',
      pageTitle: 'Home',
      head,
      content,
      initialState: JSON.stringify(ctx),
    };
    const html = await this.service.renderHtml(opts);
    this.log.verbose('Rendered HTML:', html);

    res.set('Content-Type', 'text/html').send(html);
  }
}
