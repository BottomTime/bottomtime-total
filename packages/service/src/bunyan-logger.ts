import { Injectable, LoggerService } from '@nestjs/common';
import Bunyan from 'bunyan';
import { z } from 'zod';

import { Config } from './config';

const LogLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
type LogLevel = z.infer<typeof LogLevel>;

export function createLogger(): Bunyan {
  let level: LogLevel = 'info';

  const parsed = LogLevel.safeParse(Config.logLevel);
  if (parsed.success) {
    level = parsed.data;
  }

  const logger = Bunyan.createLogger({
    name: 'gaia-project',
    level,
  });

  return logger;
}

@Injectable()
export class BunyanLogger implements LoggerService {
  constructor(private readonly logger: Bunyan) {}

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
