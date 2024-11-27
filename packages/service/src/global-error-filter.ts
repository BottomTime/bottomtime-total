import { ErrorResponseDTO, ValidationErrorDetails } from '@bottomtime/api';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { ZodError } from 'zod';

import { BunyanLoggerService } from './bunyan-logger-service';
import { Config } from './config';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  constructor(
    protected readonly log: BunyanLoggerService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  private isZodError(exception: unknown): exception is ZodError {
    return (
      exception instanceof Error &&
      exception.name === 'ZodError' &&
      'issues' in exception
    );
  }

  private handleError(exception: Error, response: ErrorResponseDTO) {
    response.message = exception.message;
    if (!Config.isProduction) response.stack = exception.stack;

    if (exception instanceof HttpException) {
      response.status = exception.getStatus();
      if (response.status === 403) {
        this.log.warn(exception);
      } else if (response.status === 503) {
        // Service unavailable error.
        // This was likely thrown by the health check controller. We'll try and return the health details as JSON.
        if (exception instanceof ServiceUnavailableException) {
          this.log.warn('Health check failed', exception.getResponse());
          response.message = 'Health check failed';
          response.details = exception.getResponse();
        } else {
          this.log.error(exception);
        }
      } else if (response.status < 500) {
        this.log.debug(exception);
      } else {
        this.log.error(exception);
      }

      if (exception.cause) {
        response.details = exception.cause;
      }
    } else if (this.isZodError(exception)) {
      this.log.debug('Zod validation error', exception.issues);

      const details: ValidationErrorDetails = { issues: exception.issues };
      response.message = 'Request validation failed';
      response.details = details;
      response.status = 400;
    } else if (
      'statusCode' in exception &&
      typeof exception.statusCode === 'number'
    ) {
      response.message = exception.message;
      response.status = exception.statusCode;
    } else {
      this.log.error(exception);
    }
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const responseBody: ErrorResponseDTO = {
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
