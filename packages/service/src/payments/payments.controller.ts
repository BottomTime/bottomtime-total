import {
  CreatePaymentSessionDTO,
  CreatePaymentSessionResponseDTO,
  CreatePaymentSessionSchema,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';

import { Config } from '../config';
import { AssertAuth, CurrentUser, User, UsersService } from '../users';
import { ZodValidator } from '../zod-validator';
import { PaymentsService } from './payments.service';

@Controller('api/payments')
@UseGuards(AssertAuth)
export class PaymentsController {
  private readonly log = new Logger(PaymentsController.name);

  constructor(
    @Inject(PaymentsService)
    private readonly service: PaymentsService,

    @Inject(UsersService)
    private readonly users: UsersService,
  ) {}

  @Get('membershp/:username')
  async getMembershipStatus(
    @Param('username') username: string,
  ): Promise<void> {
    const user = await this.users.getUserByUsernameOrEmail(username);
    if (!user) {
      throw new NotFoundException(`Memberhsip not found: "${username}"`);
    }

    await this.service.getMembershipStatus(user);
  }

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

  @Get('callback')
  @Redirect(new URL('/account', Config.baseUrl).toString())
  async checkoutCallback(
    @CurrentUser() user: User,
    @Query('sessionId') sessionId: string,
  ): Promise<void> {
    this.log.debug('Received Stripe checkout session callback:', sessionId);
    await this.service.fulfillSessionOrder(user, sessionId);
  }

  // @Post('webhook')
  // async callback(
  //   @Headers('stripe-signature') signature: string,
  //   @Body() payload: unknown,
  // ): Promise<void> {
  //   let event: Stripe.Event;

  //   try {
  //     this.log.debug('Received Stripe webhook event:', payload);
  //     event = this.service.parseWebhookEvent(
  //       JSON.stringify(payload),
  //       signature,
  //     );
  //   } catch (error) {
  //     this.log.error('Error parsing event from Stripe:', error);
  //     throw new BadRequestException('Unable to parse event data');
  //   }

  //   if (
  //     event.type === 'checkout.session.completed' ||
  //     event.type === 'checkout.session.async_payment_succeeded'
  //   ) {
  //     this.log.debug('Fulfilling session order:', event.data.object.id);
  //     await this.service.fulfillSessionOrder(event.data.object.id);
  //   }

  //   if (event.type === 'checkout.session.async_payment_failed') {
  //     // TODO: ??
  //   }
  // }
}
