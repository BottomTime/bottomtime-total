import {
  ConflictError,
  ForbiddenError,
  MissingResourceError,
  UnauthorizedError,
  ValidationError,
} from '../../errors';
import { NextFunction, Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  details?: unknown;
  httpPath: string;
  httpMethod: string;
  username?: string;
}

export function notFound(req: Request, res: Response) {
  req.log.debug(`Returning 404 response: ${req.method} ${req.originalUrl}`);

  const error: ErrorResponse = {
    statusCode: 404,
    message:
      'The resource you are looking for could not be found. Please check your path and try again.',
    httpPath: req.originalUrl,
    httpMethod: req.method,
    username: req.user?.username,
  };

  res.status(error.statusCode).json(error);
}

// All four parameters need to be present on this function signature for Express to recognize it as an error handler.
export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  _next: NextFunction,
) {
  const json: ErrorResponse = {
    statusCode: 500,
    message:
      'An unexpected server error has occurred. The error has been logged and we are investigating it. Please try your request again later.',
    httpPath: req.originalUrl,
    httpMethod: req.method,
    username: req.user?.username,
  };

  if (error instanceof ConflictError) {
    json.statusCode = 409;
    json.message = error.message;
    json.details = {
      conflictingField: error.conflictingField ?? '<unspecified>',
    };

    req.log.info('Request was rejected with Conflict response:', {
      err: error,
    });
  } else if (error instanceof ForbiddenError) {
    json.statusCode = 403;
    json.message = error.message;

    req.log.warn('Request was rejected with Forbidden response:', {
      err: error,
    });
  } else if (error instanceof MissingResourceError) {
    json.statusCode = 404;
    json.message = error.message;

    req.log.info('Request was made for missing resource', { err: error });
  } else if (error instanceof UnauthorizedError) {
    json.statusCode = 401;
    json.message = error.message;

    req.log.warn('Request was rejected with Unauthorized response:', {
      err: error,
    });
  } else if (error instanceof ValidationError) {
    json.statusCode = 400;
    json.message = error.message;
    json.details = {
      validationErrors: error.errors,
    };

    req.log.info('Request validation failed', { err: error });
  } else {
    req.log.error('An unhandled exception was caught.', { err: error });
  }

  res.status(json.statusCode).json(json);
}
