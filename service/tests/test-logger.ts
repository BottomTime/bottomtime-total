import Logger from 'bunyan';
import path from 'path';

const BaseLogger = Logger.createLogger({
  name: 'bt-tests',
  serializers: { err: Logger.stdSerializers.err },
  level: 'debug',
  streams: [
    {
      type: 'file',
      path: path.resolve(__dirname, '../logs/tests.log'),
    },
  ],
});

export function createTestLogger(module: string): Logger {
  return BaseLogger.child({
    module,
  });
}
