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
