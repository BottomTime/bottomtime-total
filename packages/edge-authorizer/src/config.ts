/* eslint-disable no-process-env */
import { z } from 'zod';

import { LogLevel } from './logger';

export interface AppConfig {
  logLevel: string;
}

const config = z
  .object({
    BT_LOG_LEVEL: LogLevel.default('info'),
  })
  .transform<AppConfig>((env) => ({
    logLevel: env.BT_LOG_LEVEL,
  }));

export const Config = config.parse(process.env);
