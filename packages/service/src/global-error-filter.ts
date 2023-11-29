import { ErrorResponse, ValidationErrorDetails } from '@bottomtime/api';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodError } from 'zod';
import { BunyanLogger } from './bunyan-logger';
import { Config } from './config';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  constructor(
    protected readonly log: BunyanLogger,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  private handleError(exception: Error, response: ErrorResponse) {
    response.message = exception.message;
    if (!Config.isProduction) response.stack = exception.stack;

    if (exception instanceof HttpException) {
      response.status = exception.getStatus();
      if (response.status < 500) {
        this.log.warn(exception);
      } else {
        this.log.error(exception);
      }
    }

    if (exception instanceof ZodError) {
      this.log.debug(exception);

      const details: ValidationErrorDetails = { issues: exception.issues };
      response.details = details;
      response.status = 400;
      response.message = exception.message;
    }
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const responseBody: ErrorResponse = {
      method: httpAdapter.getRequestMethod(request),
      path: httpAdapter.getRequestUrl(request),
      status: 500,
      message: 'An unhandled server error has occurred.',
    };

    if (exception instanceof Error) {
      this.handleError(exception, responseBody);
    } else {
      this.log.error('Unexpected server error', exception);
    }

    httpAdapter.reply(response, responseBody, responseBody.status);
  }
}
