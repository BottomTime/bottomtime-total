import { ApiClientOptions, CurrentUserDTO } from '@bottomtime/api';

import { HttpService } from '@nestjs/axios';
import { Controller, Get, Inject, Logger, Req, Res } from '@nestjs/common';

import { isAxiosError } from 'axios';
import { Request, Response } from 'express';
import { StateTree } from 'pinia';

import { Config } from '../config';
import { JwtService } from '../jwt';
import { OriginalUrl } from '../original-url.decorator';
import { ProductionService } from './production.service';

@Controller()
export class ProductionController {
  private readonly log = new Logger(ProductionController.name);

  constructor(
    @Inject(ProductionService) private readonly service: ProductionService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(HttpService) private readonly http: HttpService,
  ) {}

  @Get('*')
  async index(
    @OriginalUrl() url: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.log.debug(`Handling render request for: ${url}`);

    const jwtToken = this.jwt.extractJwtFromRequest(req);
    const initialState: Record<string, StateTree> = {
      currentUser: {
        user: null,
      },
    };

    if (jwtToken) {
      try {
        const response = await this.http.axiosRef.get<CurrentUserDTO>(
          '/api/auth/me',
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          },
        );
        initialState.currentUser.user = response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          this.log.warn(
            'Provided JWT token was rejected. Clearing session cookie.',
          );
          res.clearCookie(Config.cookieName);
        } else {
          this.log.error(error);
        }
      }
    }

    const clientOptions: ApiClientOptions = {
      authToken: jwtToken,
      baseURL: Config.apiUrl,
    };

    try {
      const html = await this.service.renderPage(
        url,
        initialState,
        clientOptions,
      );
      this.log.verbose('Raw server-rendered Vue content:', html);

      res.set('Content-Type', 'text/html').send(html);
    } catch (error) {
      // TODO: Error handling
    }
  }
}
