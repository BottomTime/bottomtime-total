import { LoggerService } from '@nestjs/common';

import Logger from 'bunyan';

export class BunyanLoggerService implements LoggerService {
  constructor(private readonly logger: Logger) {}

  log(message: unknown, ...optionalParams: unknown[]) {
    this.logger.info(message, ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.logger.warn(message, ...optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    this.logger.debug(message, ...optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.logger.trace(message, ...optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.logger.fatal(message, ...optionalParams);
  }
}
