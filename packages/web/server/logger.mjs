import Logger from 'bunyan';
import { z } from 'zod';

import { Config } from './config.mjs';

const DefaultLogLevel = 'info';
const LogLevel = z
  .enum(['trace', 'debug', DefaultLogLevel, 'warn', 'error', 'fatal'])
  .default(DefaultLogLevel);

let logger;

export function getLogger() {
  if (logger) return logger;

  const parsed = LogLevel.safeParse(Config.logLevel);
  const level = parsed.success ? parsed.data : DefaultLogLevel;

  logger = Logger.createLogger({
    name: 'bottomtime',
    level,
    serializers: { err: Logger.stdSerializers.err },
  });

  return logger;
}
