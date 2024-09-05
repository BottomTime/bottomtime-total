import { Module } from '@nestjs/common';

import Logger from 'bunyan';

import { Config } from '../config';
import { createLogger } from '../logger';

@Module({
  providers: [
    {
      provide: Logger,
      useValue: createLogger(Config.logLevel),
    },
  ],
  exports: [Logger],
})
export class BunyanModule {}
