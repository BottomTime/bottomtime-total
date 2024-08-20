import { Module } from '@nestjs/common';

import Stripe from 'stripe';

import { Config } from '../config';
import { UsersModule } from '../users';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { StripeWebhookController } from './webhook.controller';

@Module({
  imports: [UsersModule],
  providers: [
    {
      provide: Stripe,
      useFactory: () => new Stripe(Config.stripeSdkKey),
    },
    MembershipService,
  ],
  controllers: [MembershipController, StripeWebhookController],
  exports: [MembershipService],
})
export class MembershipModule {}
