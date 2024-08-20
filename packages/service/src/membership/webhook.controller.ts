import { Controller, Post } from '@nestjs/common';

@Controller('api/stripe')
export class StripeWebhookController {
  @Post()
  async handleWebhook(): Promise<void> {}
}
