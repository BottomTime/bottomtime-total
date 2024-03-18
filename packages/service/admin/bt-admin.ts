#!/usr/bin/env ts-node-script

/* eslint-disable no-console, no-process-env */
import 'dotenv/config';
import yargs from 'yargs';

import { dbModule } from './database';
import { userModule } from './users';

async function processCommand(cmd: string[]) {
  await yargs(cmd)
    .version('1.0.0')
    .option('postgres-uri', {
      alias: 'd',
      default:
        process.env.BT_POSTGRES_URI ||
        'postgresql://bt_user:bt_admin1234@localhost:5432/bottomtime_local',
      description: 'Set the PostgresSQL connection string',
      type: 'string',
    })
    .command(dbModule)
    .command(userModule)
    .help().argv;
}

processCommand(process.argv.slice(2))
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
