import { INestApplication } from '@nestjs/common';
import { createApp } from '../../src/create-app';
import { Log } from './test-logger';
import { ServerDependencies } from '../../src/app.module';
import { TestMailer } from './test-mailer';

export async function createTestApp(
  deps: Partial<ServerDependencies> = {},
): Promise<INestApplication> {
  const app = await createApp(Log, async (): Promise<ServerDependencies> => {
    return {
      mailClient: deps.mailClient ?? new TestMailer(),
    };
  });
  await app.init();
  return app;
}
