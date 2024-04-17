/* eslint-disable no-console */
import prompts from 'prompts';
import { CommandModule } from 'yargs';

import { initDatabase } from './init-db';
import { purgeDatabase } from './purge-db';
import { seedDatabase } from './seed-db';
import { createTestData } from './test-data';

export const dbModule: CommandModule<{ 'postgres-uri': string }> = {
  command: 'db',

  describe: 'Commands for working with the database',

  async builder(yargs) {
    return yargs
      .command(
        'init',
        'Initialize a new database (including running migrations)',
        (yargs) => {
          return yargs
            .option('force', {
              alias: 'f',
              default: false,
              description:
                'Drop the database if it already exists and recreate it',
              type: 'boolean',
            })
            .help();
        },
        async (yargs) => {
          await initDatabase(yargs.postgresUri, yargs.force);
        },
      )
      .command(
        'test-data',
        'Seed the database with some randomly-generated test data',
        (yargs) => {
          return yargs
            .option('alerts', {
              default: 0,
              description: 'The number of home page alerts to generate',
              type: 'number',
            })
            .option('friends', {
              default: 0,
              description: 'The number of friend relations to generate',
              type: 'number',
            })
            .option('friendRequests', {
              default: 0,
              description: 'The number of friend requests to generate',
              type: 'number',
            })
            .option('users', {
              default: 0,
              description: 'The number of users to generate',
              type: 'number',
            })
            .option('sites', {
              default: 0,
              description: 'The number of dive sites to generate',
              type: 'number',
            })
            .option('username', {
              description:
                'The username for which friend relations and friend requests will be generated for. (Defaults to everyone.)',
              type: 'string',
            })
            .help();
        },
        async (yargs) => {
          await createTestData(yargs.postgresUri, {
            alerts: yargs.alerts,
            friends: yargs.friends,
            friendRequests: yargs.friendRequests,
            diveSites: yargs.sites,
            users: yargs.users,
            targetUser: yargs.username,
          });
        },
      )
      .command(
        'purge',
        'Purge all data from the database!',
        (yargs) => {
          return yargs
            .option('auto-accept', {
              default: false,
              description:
                'Do not show the confirmation prompt. Just nuke the database!',
              type: 'boolean',
            })
            .help();
        },
        async (yargs) => {
          const confirmed = yargs.autoAccept
            ? true
            : (
                await prompts({
                  type: 'confirm',
                  name: 'confirmed',
                  message:
                    'Are you sure you want to purge the database? This cannot be undone!!',
                  initial: false,
                })
              ).confirmed;

          if (confirmed) {
            await purgeDatabase(yargs.postgresUri);
          } else {
            console.log('Aborted.');
          }
        },
      )
      .command(
        'seed',
        'Seed the database with initial static data',
        (yargs) => {
          return yargs.help();
        },
        async (yargs) => {
          await seedDatabase(yargs.postgresUri);
        },
      );
  },

  async handler() {
    /* TODO */
  },
};
