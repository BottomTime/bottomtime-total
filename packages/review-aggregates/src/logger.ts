import bunyan from 'bunyan';

import { Config } from './config';

export const Logger = bunyan.createLogger({
  name: 'bottomtime-review-aggregator',
  level: Config.logLevel,
  stream: process.stdout,
  serializers: { err: bunyan.stdSerializers.err },
});
