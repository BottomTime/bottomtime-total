/* eslint-disable no-console */
import prompts from 'prompts';
import { CommandModule } from 'yargs';

import { generateDiveProfile } from './dive-profile';
import { initDatabase } from './init-db';
import { purgeDatabase } from './purge-db';
import { seedDatabase } from './seed-db';
import { createTestData } from './test-data';

export const dbModule: CommandModule<{
  'postgres-uri': string;
  'require-ssl': boolean;
}> = {
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
          await initDatabase(yargs.postgresUri, yargs.requireSsl, yargs.force);
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
            .option('logEntries', {
              default: 0,
              description: 'The number of dive log entries to generate',
              type: 'number',
            })
            .option('notifications', {
              default: 0,
              description: 'The number of notifications to generate',
              type: 'number',
            })
            .option('operators', {
              default: 0,
              description: 'The number of dive operators to generate',
              type: 'number',
            })
            .option('operator-reviews', {
              default: 0,
              description: 'The number of dive operator reviews to generate',
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
            .option('site-reviews', {
              default: 0,
              description: 'The number of dive site reviews to generate',
              type: 'number',
            })
            .option('username', {
              description:
                'The username for which friend relations, friend requests, or log entries will be generated for. (Defaults to everyone.)',
              type: 'string',
            })
            .option('operator', {
              description:
                'The key (slug) identifying the operator for which operator reviews will be generated',
              type: 'string',
            })
            .option('site', {
              description:
                'The ID of the dive site for which site reviews will be generated',
              type: 'string',
            })
            .epilogue(
              'HINT: When generating test user accounts the passwords will be set to "Password1" for easy access!',
            )
            .help();
        },
        async (yargs) => {
          await createTestData(yargs.postgresUri, yargs.requireSsl, {
            alerts: yargs.alerts,
            friends: yargs.friends,
            friendRequests: yargs.friendRequests,
            diveOperators: yargs.operators,
            diveOperatorReviews: yargs.operatorReviews,
            diveSites: yargs.sites,
            diveSiteReviews: yargs.siteReviews,
            logEntries: yargs.logEntries,
            notifications: yargs.notifications,
            users: yargs.users,
            targetUser: yargs.username,
            targetDiveSite: yargs.site,
            targetOperator: yargs.operator,
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
            await purgeDatabase(yargs.postgresUri, yargs.requireSsl);
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
          await seedDatabase(yargs.postgresUri, yargs.requireSsl);
        },
      )
      .command(
        'dive-profile [entry-id]',
        'Generate a test dive profile for a log entry',
        (yargs) => {
          return yargs
            .positional('entry-id', {
              alias: 'e',
              type: 'string',
              description:
                'The ID of the log entry to append a dive profile to',
            })
            .demandOption('entry-id')
            .help();
        },
        async (yargs) => {
          await generateDiveProfile(
            yargs.postgresUri,
            yargs.requireSsl,
            yargs.entryId,
          );
        },
      );
  },

  async handler() {
    /* TODO */
  },
};
