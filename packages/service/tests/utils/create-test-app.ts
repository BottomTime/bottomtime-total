import Bunyan from 'bunyan';
import path from 'path';
import { createApp } from '../../src/create-app';
import { INestApplication } from '@nestjs/common';

export function createTestLogger(): Bunyan {
  return Bunyan.createLogger({
    name: 'bt-tests',
    serializers: { err: Bunyan.stdSerializers.err },
    level: 'debug',
    streams: [
      {
        type: 'file',
        path: path.resolve(__dirname, '../../logs/tests.log'),
      },
    ],
  });
}

export async function createTestApp(
  logger?: Bunyan,
): Promise<INestApplication> {
  const app = await createApp(logger ?? createTestLogger());
  await app.init();
  return app;
}
