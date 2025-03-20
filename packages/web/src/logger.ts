import { ConsoleFormattedStream } from '@browser-bunyan/console-formatted-stream';

import { createLogger } from 'browser-bunyan';

import { Config } from './config';

const Logger = createLogger({
  name: 'bottomtime-web',
  level: Config.logLevel,
  stream: new ConsoleFormattedStream(),
});

Logger.info(`Logger initialized with log level "${Config.logLevel}"`);

export function useLogger(component: string) {
  return Logger.child({ component });
}
