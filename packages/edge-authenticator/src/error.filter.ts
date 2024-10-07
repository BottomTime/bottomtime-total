import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { Config } from './config';
import { BunyanLoggerService } from './logger';

type ErrorResponse = {
  message: string;
  status: number;
  method: string;
  path: string;
};

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  constructor(private readonly log: BunyanLoggerService) {}

  private handleHttpException(
    exception: HttpException,
    responseBody: ErrorResponse,
    res: Response,
  ) {
    const status = exception.getStatus();

    if (status === HttpStatus.UNAUTHORIZED) {
      // If the JWT is rejected then clear the cookie and render the unauthorized page.
      res.cookie(Config.cookie.name, '', {
        domain: Config.cookie.domain,
        path: '/',
        httpOnly: true,
        secure: true,
      });
      res.status(HttpStatus.UNAUTHORIZED).render('unauthorized');
      return;
    }

    responseBody.status = status;
    responseBody.message = exception.message;

    res.status(status).json(responseBody);
  }

  private handleError(
    error: Error,
    responseBody: ErrorResponse,
    res: Response,
  ) {
    if (error instanceof HttpException) {
      this.handleHttpException(error, responseBody, res);
      return;
    }

    responseBody.message = error.message;
    res.status(500).json(responseBody);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const httpCtx = host.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();
    const errorResponse: ErrorResponse = {
      message: 'Internal server error',
      status: 500,
      method: req.method,
      path: req.path,
    };

    this.log.error(exception);

    if (exception instanceof Error) {
      this.handleError(exception, errorResponse, res);
      return;
    }

    res.status(500).json(errorResponse);
  }
}
