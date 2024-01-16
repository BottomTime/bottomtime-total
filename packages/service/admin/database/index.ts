/* eslint-disable no-console */
import prompts from 'prompts';
import { CommandModule } from 'yargs';

import { createTestData } from './test-data';
import { purgeDatabase } from './purge-db';
import { seedDatabase } from './seed-db';

export const dbModule: CommandModule<{ 'mongo-uri': string }> = {
  command: 'db',

  describe: 'Commands for working with the database',

  async builder(yargs) {
    return yargs
      .command(
        'test-data',
        'Seed the database with some randomly-generated test data',
        (yargs) => {
          return yargs.help();
        },
        async (yargs) => {
          await createTestData(yargs.mongoUri);
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
            await purgeDatabase(yargs.mongoUri);
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
          await seedDatabase(yargs.mongoUri);
        },
      );
  },

  async handler() {
    /* TODO */
  },
};
