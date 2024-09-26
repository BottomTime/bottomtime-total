import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Response } from 'express';

import { Config } from './config';
import { BunyanLoggerService } from './logger';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  constructor(private readonly log: BunyanLoggerService) {}

  private handleHttpException(exception: HttpException, res: Response) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    if (status === HttpStatus.UNAUTHORIZED) {
      // If the JWT is rejected then clear the cookie and render the unauthorized page.
      res.clearCookie(Config.cookie.name);
      res.render('unauthorized');
      return;
    }

    res.status(status).json(
      typeof response === 'string'
        ? {
            message: response,
            stack: exception.stack,
          }
        : response,
    );
  }

  private handleError(error: Error, res: Response) {
    if (error instanceof HttpException) {
      this.handleHttpException(error, res);
      return;
    }

    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    this.log.error(exception);

    if (exception instanceof Error) {
      this.handleError(exception, res);
      return;
    }

    res.status(500).json({
      message: 'Internal server error',
    });
  }
}
