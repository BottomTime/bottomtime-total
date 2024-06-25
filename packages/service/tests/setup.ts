/* eslint-disable no-console, no-process-env */
import { mkdir } from 'fs/promises';
import path from 'path';

import { initDatabase } from '../admin/database/init-db';
import { PostgresRequireSsl, PostgresUri } from './postgres-uri';

export default async function (): Promise<void> {
  // Create a directory for logs
  await mkdir(path.resolve(__dirname, '../logs'), { recursive: true });

  // Generate super insecure passwords for testing. We don't need the test suite taking forever to run
  // and we don't care about security in a testing context.
  process.env.BT_PASSWORD_SALT_ROUNDS = '1';

  // Now create the test database
  await initDatabase(PostgresUri, PostgresRequireSsl, true);
}
