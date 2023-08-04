#!/usr/bin/env ts-node-script

/* eslint-disable no-console, no-process-env */
import yargs from 'yargs';
import { getUserToken } from './get-user-token';

import { createTestData } from './test-data';

import 'dotenv-defaults/config';
import { purgeDatabase } from './purge-db';
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
    .command(
      'token <user>',
      'Gets a token for a user',
      async (yargs) => {
        return await yargs
          .positional('user', {
            demandOption: true,
            description: "The user's username or email address.",
            type: 'string',
          })
          .help();
      },
      async (yargs) => {
        await getUserToken(yargs.mongoUri, yargs.user);
      },
    )
    .command(
      'test-data',
      'Seed the database with some randomly-generated test data',
      async (yargs) => {
        return await yargs.help();
      },
      async (yargs) => {
        await createTestData(yargs.mongoUri);
      },
    )
    .command(
      'purge-db',
      'Purge all data from the database!',
      async (yargs) => {
        return await yargs.help();
      },
      async (yargs) => {
        await purgeDatabase(yargs.mongoUri);
      },
    )
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
