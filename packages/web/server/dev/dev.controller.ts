import { CurrentUserDTO } from '@bottomtime/api';

import { HttpService } from '@nestjs/axios';
import { Controller, Get, Inject, Logger, Req, Res } from '@nestjs/common';

import { isAxiosError } from 'axios';
import { Request, Response } from 'express';
import { readFile } from 'fs/promises';
import Mustache from 'mustache';
import { dirname, resolve } from 'path';
import { StateTree } from 'pinia';
import { fileURLToPath } from 'url';

import { DevService } from '.';
import { Config } from '../config';
import { PageOptions } from '../constants';
import { JwtService } from '../jwt';
import { OriginalUrl } from '../original-url.decorator';
import { ErrorPageHtml } from './error-page';

@Controller('/')
export class DevController {
  private readonly log = new Logger(DevController.name);
  private readonly htmlTemplatePath: string;

  constructor(
    @Inject(JwtService)
    private readonly jwt: JwtService,

    @Inject(HttpService)
    private readonly http: HttpService,

    @Inject(DevService)
    private readonly vite: DevService,
  ) {
    this.htmlTemplatePath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../index.html',
    );
  }

  @Get('*')
  async render(
    @OriginalUrl() url: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.log.debug(`Handling render request for: ${url}`);

    this.log.debug(`Reading HTML template from ${this.htmlTemplatePath}...`);
    const htmlTemplate = await readFile(this.htmlTemplatePath, 'utf-8');

    const html = await this.vite.transformHtml(url, htmlTemplate);
    this.log.verbose('Transformed HTML:', html);

    const authToken = this.jwt.extractJwtFromRequest(req);
    let currentUser: CurrentUserDTO = { anonymous: true };

    if (authToken) {
      try {
        const response = await this.http.axiosRef.get<CurrentUserDTO>(
          '/api/auth/me',
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );
        currentUser = response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          // The JWT token was rejected. Most likely, it was expired.
          // Remove any session cookies before continuing.
          this.log.warn(
            'Provided JWT token was rejected. Clearing session cookie.',
          );
          res.clearCookie(Config.cookieName);
        } else {
          // For other error types, we'll log it for investigation later.
          this.log.error(error);
        }
      }
    }

    const initialState: Record<string, StateTree> = {
      currentUser: {
        currentUser: currentUser.anonymous ? null : currentUser,
      },
    };

    try {
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
        initialState: rendered.initialState,
      };

      const content = Mustache.render(html, opts);
      res.set('Content-Type', 'text/html').send(content);
    } catch (error) {
      let serverError: { name: string; message: string; stack?: string };

      if (error instanceof Error) {
        serverError = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        serverError = {
          name: 'UnknownError',
          message:
            'An unknown error occurred. Check the application logs for more information.',
        };
      }

      const content = Mustache.render(ErrorPageHtml, serverError);
      res.status(500).set('Content-Type', 'text/html').send(content);
    }
  }
}
