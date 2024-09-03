import {
  MembershipStatusDTO,
  PaymentSessionDTO,
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
  ) {}

  /**
   * @openapi
   * /api/membership/{username}:
   *   get:
   *     operationId: getMembershipStatus
   *     summary: Get membership status
   *     description: Gets the membership status for a user.
   *     tags:
   *       - Memberships
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the membership status information will
   *           be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/MembershipStatus"
   *       "401":
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the user is not authorized to access the requested resource.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the requested user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async getMembershipStatus(
    @TargetUser() user: User,
  ): Promise<MembershipStatusDTO> {
    return await this.service.getMembershipStatus(user);
  }

  /**
   * @openapi
   * /api/membership/{username}:
   *   put:
   *     operationId: createOrUpdateMembership
   *     summary: Create or update a user's membership
   *     description: |
   *       Creates or updates the membership status for a user.
   *       - If `newAccountTier` is the same as the user's existing tier then a HTTP 400 response will be returned.
   *       - If transitioning from a free tier to a paid tier a new membership will be created.
   *       - If transitioning to a free tier an active membership will be canceled.
   *       - If transitioning from a paid tier to a different paid tier the membership will be changed and the existing membership will be prorated.
   *     tags:
   *       - Memberships
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newAccountTier
   *             properties:
   *               newAccountTier:
   *                 type: number
   *                 format: int32
   *                 enum:
   *                   - 0
   *                   - 100
   *                   - 200
   *                 title: New Account Tier
   *                 description: |
   *                   The new account tier to assign to the user.
   *                   - `0` - Free tier
   *                   - `100` - Pro tier
   *                   - `200` - Shop Owner tier
   *                 example: 200
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the updated membership status will be
   *           returned in the response body. Note that payment information may still be required.
   *           Check the `status` field to determine the current membership status. If it is not
   *           `active` or `trialing` then further steps are required to provision the user's new
   *           membership.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/MembershipStatus"
   *       "400":
   *         description: |
   *           The request failed because of one of the following reasons:
   *           - No changes were made to the user's membership. (User is already at `newAccountTier`.)
   *           - The request body was missing or invalid.
   *           - The requested account tier does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the user is not authorized to perform this action.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the requested user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put()
  async createOrUpdateMembership(
    @TargetUser() user: User,
    @Body(new ZodValidator(UpdateMembershipParamsSchema))
    { newAccountTier }: UpdateMembershipParamsDTO,
  ): Promise<MembershipStatusDTO> {
    // TODO: Ensure that an email notification gets sent out
    this.log.debug(`Updating membership for user: ${user.username}`, {
      oldTier: user.accountTier,
      newTier: newAccountTier,
    });
    return await this.service.updateMembership(user, newAccountTier);
  }

  @Delete()
  async cancelMembership(@TargetUser() user: User): Promise<void> {
    // TODO: Ensure that an email notification gets sent out
    this.log.debug('Cancelling membership for user:', user.username);
    await this.service.cancelMembership(user);
  }

  @Post('session')
  async createSession(@TargetUser() user: User): Promise<PaymentSessionDTO> {
    this.log.debug('Creating payment session for user:', user.username);
    const session = await this.service.createPaymentSession(user);

    if (!session) {
      throw new BadRequestException(
        'Unable to get session secret. User does not have a subscription yet.',
      );
    }

    return session;
  }
}
