import {
  CreatePaymentSessionResponseDTO,
  MembershipStatusDTO,
  UpdateMembershipParamsDTO,
  UpdateMembershipParamsSchema,
} from '@bottomtime/api';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  AssertAccountOwner,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
  User,
  UsersService,
} from '../users';
import { ZodValidator } from '../zod-validator';
import { MembershipService } from './membership.service';

@Controller('api/membership/:username')
@UseGuards(AssertAuth, AssertTargetUser, AssertAccountOwner)
export class MembershipController {
  private readonly log = new Logger(MembershipController.name);

  constructor(
    @Inject(MembershipService)
    private readonly service: MembershipService,

    @Inject(UsersService)
    private readonly users: UsersService,
  ) {}

  @Get()
  async getMembershipStatus(
    @TargetUser() user: User,
  ): Promise<MembershipStatusDTO> {
    return await this.service.getMembershipStatus(user);
  }

  @Put()
  async createOrUpdateMembership(
    @TargetUser() user: User,
    @Body(new ZodValidator(UpdateMembershipParamsSchema))
    { newAccountTier }: UpdateMembershipParamsDTO,
  ): Promise<MembershipStatusDTO> {
    return await this.service.updateMembership(user, newAccountTier);
  }

  @Delete()
  async cancelMembership(@TargetUser() user: User): Promise<void> {
    this.log.debug('Cancelling membership for user:', user.username);
    await this.service.cancelMembership(user);
  }

  @Post('session')
  async createSession(
    @TargetUser() user: User,
  ): Promise<CreatePaymentSessionResponseDTO> {
    this.log.debug('Creating payment session for user:', user.username);
    const clientSecret = await this.service.getPaymentSecret(user);

    if (!clientSecret) {
      throw new BadRequestException(
        'Unable to get session secret. User does not have a subscription yet.',
      );
    }

    return { clientSecret };
  }

  // @Post('membershipWebhook')
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
