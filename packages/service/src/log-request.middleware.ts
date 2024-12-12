import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';
import requestStats from 'request-stats';

import { User } from './users';

@Injectable()
export class LogRequestMiddleware implements NestMiddleware {
  private readonly log = new Logger('RequestLog');

  use(req: Request, res: Response, next: NextFunction) {
    requestStats(req, res, (stats) => {
      const user = req.user instanceof User ? req.user : undefined;
      this.log.log({
        method: req.method,
        path: req.path,
        geolocation: req.geolocation
          ? {
              country: req.geolocation.country_name,
              stateOrProvince: req.geolocation.state_prov,
              timezone: req.geolocation.time_zone.name,
            }
          : undefined,
        ip: req.ip,
        userAgent: req.useragent?.source,
        statusCode: res.statusCode,
        duration: stats.time,
        bytesRecieved: stats.req.bytes,
        bytesSent: stats.res.bytes,
        user: user
          ? {
              id: user.id,
              username: user.username,
            }
          : '<anonymous>',
      });
    });

    next();
  }
}
