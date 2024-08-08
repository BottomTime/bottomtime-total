import { CreatePaymentSessionResponseDTO } from '@bottomtime/api';

import { Controller, Inject, Post } from '@nestjs/common';

import { PaymentsService } from './payments.service';

@Controller('api/payments')
export class PaymentsController {
  constructor(
    @Inject(PaymentsService)
    private readonly service: PaymentsService,
  ) {}

  @Post('session')
  async createSession(): Promise<CreatePaymentSessionResponseDTO> {
    const clientSecret = await this.service.createSession();
    return { clientSecret };
  }
}
