import Logger from 'bunyan';
import path from 'path';

function createTestLogger(): Logger {
  return Logger.createLogger({
    name: 'bt-tests',
    serializers: { err: Logger.stdSerializers.err },
    level: 'trace',
    streams: [
      {
        type: 'rotating-file',
        path: path.resolve(__dirname, '../logs/tests.log'),
        period: '1d',
        count: 4,
      },
    ],
  });
}

export const Log = createTestLogger();
