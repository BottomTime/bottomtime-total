import {
  AccountTier,
  MembershipStatusDTO,
  PaymentSessionDTO,
  UpdateMembershipParamsDTO,
  UpdateMembershipParamsSchema,
} from '@bottomtime/api';
import { EmailQueueMessage, EmailType } from '@bottomtime/common';

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Queues } from '../common';
import { InjectQueue, Queue } from '../queue';
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

    @InjectQueue(Queues.email)
    private readonly emailQueue: Queue,
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

    const previousTier = user.accountTier;
    const membershipInfo = await this.service.updateMembership(
      user,
      newAccountTier,
    );
    const newTier = user.accountTier;

    if (previousTier !== newTier && user.email) {
      const emailOptions: EmailQueueMessage =
        newTier === AccountTier.Basic
          ? {
              to: { to: user.email },
              subject: 'Membership Canceled',
              options: {
                type: EmailType.MembershipCanceled,
                title: 'Membership Canceled',
                user: {
                  username: user.username,
                  email: user.email,
                  profile: {
                    name: user.profile.name || user.username,
                  },
                },
              },
            }
          : {
              to: { to: user.email },
              subject: 'Membership Updated',
              options: {
                type: EmailType.MembershipChanged,
                title: 'Membership Updated',
                user: {
                  email: user.email,
                  profile: {
                    name: user.profile.name || user.username,
                  },
                  username: user.username,
                },
                newTier: this.service.getAccountTierName(newTier),
                previousTier: this.service.getAccountTierName(previousTier),
              },
            };
      await this.emailQueue.add(JSON.stringify(emailOptions));
    }

    return membershipInfo;
  }

  /**
   * @openapi
   * /api/membership/{username}:
   *   delete:
   *     operationId: cancelMembership
   *     summary: Cancel a user's membership
   *     description: Cancels the membership for a user.
   *     tags:
   *       - Memberships
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "204":
   *         description: The request succeeded and the user's membership has been canceled.
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
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelMembership(@TargetUser() user: User): Promise<void> {
    this.log.debug('Cancelling membership for user:', user.username);
    const result = await this.service.cancelMembership(user);

    if (result && user.email) {
      this.log.log(`Membership canceled for user: ${user.username}`);

      const email: EmailQueueMessage = {
        to: { to: user.email },
        subject: 'Membership Canceled',
        options: {
          type: EmailType.MembershipCanceled,
          title: 'Membership Canceled',
          user: {
            username: user.username,
            email: user.email,
            profile: {
              name: user.profile.name || user.username,
            },
          },
        },
      };
      await this.emailQueue.add(JSON.stringify(email));
    }
  }

  /**
   * @openapi
   * /api/membership/{username}/session:
   *   post:
   *     operationId: createPaymentSession
   *     summary: Create a payment session
   *     description: Creates a payment session for a user.
   *     tags:
   *       - Memberships
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: The request succeeded and the payment session has been created. The details will be in the request body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - clientSecret
   *                 - products
   *                 - currency
   *                 - total
   *                 - frequency
   *               properties:
   *                 clientSecret:
   *                   title: Client Secret
   *                   type: string
   *                   description: |
   *                     The client secret for the payment session. This is required to initialize Stripe's Payment Element for collecting
   *                     a user's payment information.
   *                     See [Stripe's documentation](https://stripe.com/docs/payments/accept-a-payment) for more information.
   *                   example: "pi_1J9Fjv"
   *                 products:
   *                   type: array
   *                   title: Products
   *                   description: An array of products being payed for by the user.
   *                   items:
   *                     type: object
   *                     required:
   *                       - product
   *                       - price
   *                     properties:
   *                       product:
   *                         type: string
   *                         title: Product
   *                         description: Name of the product.
   *                         example: Pro Membership
   *                       price:
   *                         type: number
   *                         format: float
   *                         title: Price
   *                         description: The price of the product.
   *                         example: 49.99
   *                 currency:
   *                   type: string
   *                   title: Currency
   *                   pattern: "^[a-z]{3}$"
   *                   description: |
   *                     The currency code for the payment session. This is the currency in which the prices are being dispalyed in
   *                     and in which the payment will be collected.
   *                   example: cad
   *                 tax:
   *                   type: number
   *                   format: float
   *                   title: Tax
   *                   description: The tax amount for the payment session.
   *                   example: 5.99
   *                 total:
   *                   type: number
   *                   format: float
   *                   title: Total
   *                   description: The total amount for the payment session. This will be the sum of all products, taxes, and discounts.
   *                   example: 55.98
   *                 discounts:
   *                   type: number
   *                   format: float
   *                   title: Discounts
   *                   description: The discount amount for the payment session.
   *                   example: 0
   *                 frequency:
   *                   type: string
   *                   title: Frequency
   *                   enum:
   *                     - day
   *                     - week
   *                     - month
   *                     - year
   *                   description: |
   *                     The frequency at which the user will be billed for the membership.
   *                   example: year
   *       "400":
   *         description: The request failed because the user does not have a subscription yet.
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
  @Post('session')
  @HttpCode(HttpStatus.OK)
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
