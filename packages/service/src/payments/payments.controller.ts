import {
  CreatePaymentSessionDTO,
  CreatePaymentSessionResponseDTO,
  CreatePaymentSessionSchema,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
} from '@nestjs/common';

import Stripe from 'stripe';

import { CurrentUser, User } from '../users';
import { ZodValidator } from '../zod-validator';
import { PaymentsService } from './payments.service';

@Controller('api/payments')
export class PaymentsController {
  private readonly log = new Logger(PaymentsController.name);

  constructor(
    @Inject(PaymentsService)
    private readonly service: PaymentsService,
  ) {}

  @Post('session')
  async createSession(
    @CurrentUser() user: User,
    @Body(new ZodValidator(CreatePaymentSessionSchema))
    options: CreatePaymentSessionDTO,
  ): Promise<CreatePaymentSessionResponseDTO> {
    this.log.debug('Creating payment session for user:', user.username);
    const clientSecret = await this.service.createSession(
      user,
      options.accountTier,
    );
    return { clientSecret };
  }

  @Post('webhook')
  async callback(
    @Headers('stripe-signature') signature: string,
    @Body() payload: unknown,
  ): Promise<void> {
    let event: Stripe.Event;

    try {
      this.log.debug('Received Stripe webhook event:', payload);
      event = this.service.parseWebhookEvent(
        JSON.stringify(payload),
        signature,
      );
    } catch (error) {
      this.log.error('Error parsing event from Stripe:', error);
      throw new BadRequestException('Unable to parse event data');
    }

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      this.log.debug('Fulfilling session order:', event.data.object.id);
      await this.service.fulfillSessionOrder(event.data.object.id);
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      // TODO: ??
    }
  }
}
