import {
  CreatePaymentSessionDTO,
  CreatePaymentSessionResponseDTO,
  CreatePaymentSessionSchema,
} from '@bottomtime/api';

import { Body, Controller, Inject, Post } from '@nestjs/common';

import { CurrentUser, User } from '../users';
import { ZodValidator } from '../zod-validator';
import { PaymentsService } from './payments.service';

@Controller('api/payments')
export class PaymentsController {
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
    const clientSecret = await this.service.createSession(
      user,
      options.accountTier,
    );
    return { clientSecret };
  }

  @Post('callback')
  async callback(): Promise<void> {}
}
