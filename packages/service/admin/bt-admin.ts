#!/usr/bin/env ts-node-script
/* eslint-disable no-console */
import yargs from 'yargs';
import { getUserToken } from './get-user-token';

import 'dotenv-defaults/config';

async function processCommand(cmd: string[]) {
  await yargs(cmd)
    .version('1.0.0')
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
        await getUserToken(yargs.user);
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
