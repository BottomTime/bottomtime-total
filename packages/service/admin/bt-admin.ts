#!/usr/bin/env ts-node-script

/* eslint-disable no-console, no-process-env */
import 'dotenv/config';
import yargs from 'yargs';

import { dbModule } from './database';
import { userModule } from './users';

async function processCommand(cmd: string[]) {
  await yargs(cmd)
    .version('1.0.0')
    .option('mongo-uri', {
      alias: 'm',
      default:
        process.env.BT_MONGO_URI ??
        'mongodb://127.0.0.1:27017/bottomtime-local',
      description: 'Set the MongoDB connection string',
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
