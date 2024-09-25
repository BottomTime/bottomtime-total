import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { BunyanLoggerService } from './logger';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  constructor(private readonly log: BunyanLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    this.log.error(exception);
  }
}
