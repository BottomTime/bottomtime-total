import { exec } from 'child_process';
import path from 'path';

import { PostgresFixture } from './fixtures/postgres.fixture';

export default function (): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(
      `yarn admin db init -f -d "${PostgresFixture.postgresUri}"`,
      {
        cwd: path.resolve(__dirname, '../../service/'),
      },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      },
    );
  });
}
