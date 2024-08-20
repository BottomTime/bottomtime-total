/* eslint-disable no-process-env */
import { CommandModule } from 'yargs';

import { initProducts } from './init-products';

export const stripeModule: CommandModule = {
  command: 'stripe',
  describe: 'Commands for managing Stripe account',

  builder(yargs) {
    return yargs
      .command(
        'init-products',
        'Initialize Stripe product catalogue',
        (yargs) => {
          return yargs
            .positional('sdk-key', {
              alias: 'k',
              description:
                'Stripe SDK key (secret key) for accessing the APIs.',
              type: 'string',
              default: process.env.BT_STRIPE_SDK_KEY || '',
            })
            .help();
        },
        async (yargs) => {
          await initProducts(yargs.sdkKey);
        },
      )
      .help();
  },

  async handler(yargs) {},
};
