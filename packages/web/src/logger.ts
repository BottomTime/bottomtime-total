import { ConsoleFormattedStream } from '@browser-bunyan/console-formatted-stream';

import { createLogger } from 'browser-bunyan';

import { Config } from './config';

export const Logger = createLogger({
  name: 'bottomtime-web',
  level: Config.logLevel,
  stream: new ConsoleFormattedStream(),
});
