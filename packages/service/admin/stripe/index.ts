/* eslint-disable no-process-env */
import { CommandModule } from 'yargs';

import { initProducts } from './init-products';
import { createWebhookEndpoint } from './webhooks';

export const stripeModule: CommandModule = {
  command: 'stripe',
  describe: 'Commands for managing Stripe account',

  builder(yargs) {
    return yargs
      .option('sdk-key', {
        alias: 'k',
        description: 'Stripe SDK key (secret key) for accessing the APIs.',
        type: 'string',
        default: process.env.BT_STRIPE_SDK_KEY || '',
      })
      .command(
        'init-products',
        'Initialize Stripe product catalogue',
        (yargs) => {
          return yargs.help();
        },
        async (yargs) => {
          await initProducts(yargs.sdkKey);
        },
      )
      .command(
        'webhooks <url>',
        'Provisions a webhook endpoint in Stripe',
        (yargs) => {
          return yargs
            .positional('url', {
              type: 'string',
              demandOption: true,
              description:
                'URL to provision as the webhook endpoint. (E.g. https://example.com/api/stripe)',
            })
            .help();
        },
        async (yargs) => {
          await createWebhookEndpoint(yargs.sdkKey, yargs.url);
        },
      )
      .help();
  },

  async handler() {
    /* No-op */
  },
};
