import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';

import { MembershipService } from './membership.service';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('api/stripe')
export class StripeWebhookController {
  constructor(
    @Inject(MembershipService) private readonly service: MembershipService,
    @Inject(StripeWebhookService)
    private readonly webhooks: StripeWebhookService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() payload: unknown,
  ): Promise<void> {
    await this.webhooks.handleWebhookEvent(JSON.stringify(payload), signature);
  }
}
