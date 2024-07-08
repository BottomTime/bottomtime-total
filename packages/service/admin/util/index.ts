import { CommandModule } from 'yargs';

import { generateSessionSecret } from './generate-session-secret';

export const utilModule: CommandModule = {
  command: 'util',

  describe: 'Utility commands',

  builder(yargs) {
    return yargs
      .command(
        'session-secret',
        'Generates a new random session secret string',
        (yargs) =>
          yargs
            .positional('bits', {
              alias: 'b',
              default: 512,
              description:
                'The strength of the secret in bits. A higher number will generate a string that is more secure but less performant.',
              type: 'number',
            })
            .help(),
        (yargs) => {
          generateSessionSecret(yargs.bits);
        },
      )
      .help();
  },

  async handler() {
    /* TODO */
  },
};
