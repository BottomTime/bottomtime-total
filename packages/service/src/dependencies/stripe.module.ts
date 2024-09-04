import { Module } from '@nestjs/common';

import Stripe from 'stripe';

import { Config } from '../config';

@Module({
  providers: [
    {
      provide: Stripe,
      useFactory() {
        return new Stripe(Config.stripe.sdkKey);
      },
    },
  ],
  exports: [Stripe],
})
export class StripeModule {}
