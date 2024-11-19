import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

import { Request, Response } from 'express';
import requestStats from 'request-stats';
import { Observable } from 'rxjs';

import { User } from './users';

@Injectable()
export class LogRequestInterceptor implements NestInterceptor {
  private readonly log = new Logger('RequestLog');

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    requestStats(req, res, (stats) => {
      const user = req.user instanceof User ? req.user : undefined;
      this.log.log({
        method: req.method,
        path: req.path,
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

    return next.handle();
  }
}
