#!/usr/bin/env ts-node-script

/* eslint-disable no-console, no-process-env */
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dotenv/config';
import yargs from 'yargs';

import { dbModule } from './database';
import { userModule } from './users';
import { utilModule } from './util';

dayjs.extend(tz);
dayjs.extend(utc);

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
    .option('require-ssl', {
      alias: 's',
      default: process.env.BT_POSTGRES_REQUIRE_SSL === 'true',
      description:
        'Indicates that SSL is required for the PostgresSQL connection',
      type: 'boolean',
    })
    .command(dbModule)
    .command(userModule)
    .command(utilModule)
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
