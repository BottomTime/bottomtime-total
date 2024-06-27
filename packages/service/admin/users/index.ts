import { CommandModule } from 'yargs';

import { createAdmin } from './create-admin';
import { getUserToken } from './get-user-token';

export const userModule: CommandModule<{
  'postgres-uri': string;
  'require-ssl': boolean;
}> = {
  command: 'user',

  describe: 'Commands for managing a user account',

  builder(yargs) {
    return yargs
      .command(
        'new-admin',
        'Creates a new admin user.',
        (yargs) => {
          return yargs
            .positional('username', {
              alias: 'u',
              description: "The user's username.",
              type: 'string',
            })
            .positional('password', {
              alias: 'p',
              description: 'The password to set on the new admin account',
              type: 'string',
            })
            .help();
        },
        async (yargs) => {
          await createAdmin({
            postgresRequireSsl: yargs.requireSsl,
            potgresUri: yargs.postgresUri,
            username: yargs.username,
            password: yargs.password,
          });
        },
      )
      .command(
        'token <user>',
        'Gets a token for a user',
        (yargs) => {
          return yargs
            .positional('user', {
              demandOption: true,
              description: "The user's username or email address.",
              type: 'string',
            })
            .help();
        },
        async (yargs) => {
          await getUserToken(yargs.postgresUri, yargs.requireSsl, yargs.user);
        },
      )
      .help();
  },

  async handler() {
    /* TODO */
  },
};
