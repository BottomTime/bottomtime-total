import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';

import { Config } from './config';
import { GeolocationData } from './types/geolocation';

@Injectable()
export class GeolocationMiddleware implements NestMiddleware {
  private readonly log = new Logger(GeolocationMiddleware.name);

  constructor(@Inject(HttpService) private readonly http: HttpService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    if (!Config.ipGeolocationApiKey) {
      next();
      return;
    }

    this.log.debug(`Attempting IP Geolocation lookup for IP "${req.ip}"...`);
    this.http
      .get<GeolocationData>('https://api.ipgeolocation.io/ipgeo', {
        params: {
          apiKey: Config.ipGeolocationApiKey,
          ip: req.ip,
        },
      })
      .subscribe({
        next: ({ data }) => {
          req.geolocation = data;
        },
        error: (error) => {
          this.log.error(error);
          next();
        },
        complete: next,
      });
  }
}
