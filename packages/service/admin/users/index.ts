import { CommandModule } from 'yargs';
import { getUserToken } from './get-user-token';

export const userModule: CommandModule<{ 'mongo-uri': string }> = {
  command: 'user',

  describe: 'Commands for managing a user account',

  builder(yargs) {
    return yargs
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
          await getUserToken(yargs.mongoUri, yargs.user);
        },
      )
      .help();
  },

  async handler() {
    /* TODO */
  },
};
