import { LoggerService } from '@nestjs/common';

import Logger from 'bunyan';
import { z } from 'zod';

const LogLevel = z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
type LogLevel = z.infer<typeof LogLevel>;

export function createLogger(logLevel?: string): Logger {
  let level: LogLevel = 'info';

  const parsed = LogLevel.safeParse(logLevel);
  if (parsed.success) {
    level = parsed.data;
  }

  const logger = Logger.createLogger({
    name: 'bottomtime',
    level,
    stream: process.stdout,
    serializers: { err: Logger.stdSerializers.err },
  });

  return logger;
}

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
