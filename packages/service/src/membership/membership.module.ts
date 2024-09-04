import { Module } from '@nestjs/common';

import { Queues } from '../common';
import { Config } from '../config';
import { StripeModule } from '../dependencies';
import { QueueModule } from '../queue';
import { UsersModule } from '../users';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { MembershipsController } from './memberships.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [
    UsersModule,
    QueueModule.forFeature({
      key: Queues.email,
      queueUrl: Config.aws.sqs.emailQueueUrl,
    }),
    StripeModule,
  ],
  providers: [MembershipService, StripeWebhookService],
  controllers: [
    MembershipsController,
    MembershipController,
    StripeWebhookController,
  ],
  exports: [MembershipService],
})
export class MembershipModule {}
