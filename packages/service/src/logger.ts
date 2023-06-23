import Logger, { type LogLevelString } from 'bunyan';

const ValidLogLevels = new Set<string>([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

function isLogLevelString(value: string): value is LogLevelString {
  return ValidLogLevels.has(value);
}

export function createLogger(logLevel = 'info'): Logger {
  const logLevelString: LogLevelString = isLogLevelString(logLevel)
    ? logLevel
    : 'info';
  const logger = Logger.createLogger({
    name: 'bottomtime',
    level: logLevelString,
    stream: process.stdout,
    serializers: { err: Logger.stdSerializers.err },
  });

  if (logLevel !== logLevelString) {
    logger.warn(
      `[LOGGER] Invalid log level specified: "${logLevel}". Defaulting to "info".`,
    );
  }

  return logger;
}
