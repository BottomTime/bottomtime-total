import Logger from 'bunyan';
import { z } from 'zod';

export const LogLevel = z.enum([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);
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
