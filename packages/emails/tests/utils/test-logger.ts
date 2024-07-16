import Logger, { createLogger, stdSerializers } from 'bunyan';
import { resolve } from 'path';

function createTestLogger(): Logger {
  return createLogger({
    name: 'bt-tests',
    serializers: { err: stdSerializers.err },
    level: 'debug',
    streams: [
      {
        type: 'rotating-file',
        path: resolve(__dirname, '../../logs/tests.log'),
        period: '1d',
        count: 4,
      },
    ],
  });
}

export const Log = createTestLogger();
