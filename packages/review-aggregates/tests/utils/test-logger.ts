import bunyan from 'bunyan';
import { resolve } from 'path';

export const TestLogger = bunyan.createLogger({
  level: 'debug',
  name: 'bt-test-logger',
  serializers: { err: bunyan.stdSerializers.err },
  streams: [
    {
      type: 'rotating-file',
      path: resolve(__dirname, '../../logs/tests.log'),
      period: '1d',
      count: 4,
    },
  ],
});
