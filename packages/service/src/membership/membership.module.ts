import { DynamicModule, Module } from '@nestjs/common';

import Stripe from 'stripe';

import { UsersModule } from '../users';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { MembershipsController } from './memberships.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({})
export class MembershipModule {
  static stripe: Stripe;

  static forRoot(stripe: Stripe): DynamicModule {
    MembershipModule.stripe = stripe;
    return MembershipModule.forFeature();
  }

  static forFeature(): DynamicModule {
    if (!MembershipModule.stripe) {
      throw new Error(
        'No Stripe client provided. Did you remember to call MembershipModule.forRoot()?',
      );
    }

    return {
      module: MembershipModule,
      imports: [UsersModule],
      providers: [
        {
          provide: Stripe,
          useFactory() {
            return MembershipModule.stripe;
          },
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
    };
  }
}
