import { CurrentUserDTO } from '@bottomtime/api';
import { Controller, Get, Inject, Logger, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { dirname, resolve } from 'path';
import { fileURLToPath, resolve as resolveURL } from 'url';
import { OriginalUrl } from '../original-url.decorator';
import { PageOptions } from '../constants';
import { WebService } from './web.service';
import { JwtService } from '../jwt';
import { AppInitialState } from '../../src/common';
import axios from 'axios';
import { Config } from '../config';

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

    try {
      this.log.debug('Attempting to get current user info...');
      const { data } = await axios.get<CurrentUserDTO>(
        resolveURL(Config.apiUrl, '/api/auth/me'),
        {
          headers: jwtToken
            ? {
                Authorization: `Bearer ${jwtToken}`,
              }
            : {},
          withCredentials: true,
        },
      );

      if (data.anonymous === false) {
        initialState.currentUser = data;
      }
    } catch (error) {
      this.log.error('Failed to retrieve info for current user:', error);
    }

    const { render: ssrRender } = await import(this.serverEntryPath);
    const { head, html: content } = await ssrRender(url, initialState);
    this.log.verbose('Raw server-rendered Vue content:', content);

    const opts: PageOptions = {
      appTitle: 'Bottom Time',
      pageTitle: 'Home',
      head,
      content,
      initialState: JSON.stringify(initialState),
    };
    const html = await this.service.renderHtml(opts);
    this.log.verbose('Rendered HTML:', html);

    res.set('Content-Type', 'text/html').send(html);
  }
}
