import { Module, Scope } from '@nestjs/common';

import Stripe from 'stripe';

import { Config } from '../config';
import { UsersModule } from '../users';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [UsersModule],
  providers: [
    {
      provide: Stripe,
      useFactory: () => new Stripe(Config.stripeSdkKey),
    },
    PaymentsService,
  ],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
