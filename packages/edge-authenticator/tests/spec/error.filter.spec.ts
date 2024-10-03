import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';

import { Response } from 'express';
import { createRequest, createResponse } from 'node-mocks-http';

import { GlobalErrorFilter } from '../../src/error.filter';
import { BunyanLoggerService } from '../../src/logger';
import { Log } from '../logger';

function getArgumentHost(res: Response): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () =>
        createRequest({
          method: 'GET',
          path: '/path/to/resource',
        }),
      getResponse: () => res,
    }),
  } as ArgumentsHost;
}

describe('Global error filter', () => {
  let logService: BunyanLoggerService;
  let filter: GlobalErrorFilter;

  beforeAll(() => {
    logService = new BunyanLoggerService(Log);
    filter = new GlobalErrorFilter(logService);
  });

  it('will return a basic 500 error for an unknown exception', () => {
    const res = createResponse();
    filter.catch('An unknown error', getArgumentHost(res));
    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('will return more details if the exception is an Error object', () => {
    const error = new Error('An error object');
    const res = createResponse();

    filter.catch(error, getArgumentHost(res));

    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('will return even more details if the exception is an HttpException', () => {
    const error = new BadRequestException('This is a bad request exception');
    const res = createResponse();

    filter.catch(error, getArgumentHost(res));

    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(HttpStatus.BAD_REQUEST);
    expect(res._getJSONData()).toMatchSnapshot();
  });

  it('will attempt to invalidate the session cookie and render error page if the exception is an UNAUTHORIZED HttpException', () => {
    const error = new UnauthorizedException('Nope.');
    const res = createResponse();

    filter.catch(error, getArgumentHost(res));

    expect(res._isEndCalled()).toBe(true);
    expect(res._getStatusCode()).toBe(HttpStatus.UNAUTHORIZED);
    expect(res._getRenderView()).toBe('unauthorized');

    // expect(res._getHeaders()).toBe('');
  });
});
