import { Module } from '@nestjs/common';

import { StripeModule } from '../dependencies';
import { UsersModule } from '../users';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { MembershipsController } from './memberships.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [UsersModule, StripeModule],
  providers: [MembershipService, StripeWebhookService],
  controllers: [
    MembershipsController,
    MembershipController,
    StripeWebhookController,
  ],
  exports: [MembershipService],
})
export class MembershipModule {}
