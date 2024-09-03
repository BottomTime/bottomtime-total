import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  RawBody,
} from '@nestjs/common';

import { MembershipService } from './membership.service';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('api/stripe')
export class StripeWebhookController {
  private readonly log = new Logger(StripeWebhookController.name);

  constructor(
    @Inject(MembershipService) private readonly service: MembershipService,
    @Inject(StripeWebhookService)
    private readonly webhooks: StripeWebhookService,
  ) {}

  /**
   * @openapi
   * /api/stripe:
   *   post:
   *     operationId: handleStripeEvent
   *     summary: Stripe webhook endpoint
   *     tags:
   *       - Memberships
   *     description: |
   *       This endpoint is provided to handle incoming webhook events from Stripe. It should not be called by any
   *       other service or client. Only signed requests from Stripe will be processed.
   *
   *       For more information see the [Stripe documentation](https://docs.stripe.com/webhooks).
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer | undefined,
  ): Promise<void> {
    if (!payload) {
      throw new BadRequestException('No payload provided in request body.');
    }

    const payloadString = payload.toString('utf-8');
    this.log.verbose('Received webhook event:', payloadString);

    await this.webhooks.handleWebhookEvent(payloadString, signature);
  }
}
