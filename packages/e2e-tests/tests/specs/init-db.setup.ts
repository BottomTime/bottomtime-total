/* eslint-disable no-console */
import { test as setup } from '@playwright/test';

import { exec } from 'child_process';
import path from 'path';

import { PostgresFixture } from '../fixtures/postgres.fixture';

setup('Initialize Database', async () => {
  setup.setTimeout(60000);
  await new Promise<void>((resolve, reject) => {
    exec(
      `yarn admin db init -f -d "${PostgresFixture.postgresUri}"`,
      {
        cwd: path.resolve(__dirname, '../../../service/'),
      },
      (error, stdout, stderr) => {
        console.log(stdout);
        console.error(stderr);
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve();
        }
      },
    );
  });
});
