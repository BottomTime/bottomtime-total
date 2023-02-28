import Logger from 'bunyan';

export function createTestLogger(module: string): Logger {
  return Logger.createLogger({
    name: module,
  });
}
