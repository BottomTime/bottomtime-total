import { Module } from '@nestjs/common';

import Stripe from 'stripe';

import { Config } from '../config';
import { UsersModule } from '../users';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { MembershipsController } from './memberships.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [UsersModule],
  providers: [
    {
      provide: Stripe,
      useFactory: () => new Stripe(Config.stripe.sdkKey),
    },
    MembershipService,
    StripeWebhookService,
  ],
  controllers: [
    MembershipsController,
    MembershipController,
    StripeWebhookController,
  ],
  exports: [MembershipService],
})
export class MembershipModule {}
