import {
  AcknowledgeFriendRequestParamsDTO,
  AcknowledgeFriendRequestParamsSchema,
  ApiList,
  FriendRequestDTO,
  ListFriendRequestsParamsDTO,
  ListFriendRequestsParamsSchema,
} from '@bottomtime/api';
import { EventKey } from '@bottomtime/common';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Logger,
  NotFoundException,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { EventsService, FriendRequestEvent } from '../events';
import { AssertAuth, AssertTargetUser, TargetUser, User } from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertFriend, TargetFriend } from './assert-friend.guard';
import { AssertFriendshipOwner } from './assert-friendship-owner.guard';
import { FriendsService } from './friends.service';

const UsernameParam = 'username';
const FriendParam = 'friend';

@Controller(`api/users/:${UsernameParam}/friendRequests`)
@UseGuards(AssertAuth, AssertTargetUser, AssertFriendshipOwner)
export class FriendRequestsController {
  private readonly log: Logger = new Logger(FriendRequestsController.name);

  constructor(
    @Inject(FriendsService) private readonly friendsService: FriendsService,
    @Inject(EventsService) private readonly events: EventsService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/friendRequests:
   *   get:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: List friend requests
   *     operationId: listFriendRequests
   *     description: |
   *       Lists the friend requests of a user.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *       - name: direction
   *         in: query
   *         description: |
   *           The direction of the friend request.
   *           * `incoming` - The friend request was sent to the user.
   *           * `outgoing` - The friend request was sent by the user.
   *           * `both` - Both incoming and outgoing friend requests.
   *         schema:
   *           type: string
   *           enum:
   *             - incoming
   *             - outgoing
   *             - both
   *       - name: showAcknowledged
   *         in: query
   *         description: Whether or not to return friend requests that have already been accepted/rejected.
   *         schema:
   *           type: boolean
   *           default: false
   *           example: true
   *       - name: showExpired
   *         in: query
   *         description: Whether or not to return friend requests that have expired.
   *         schema:
   *           type: boolean
   *           default: false
   *           example: true
   *       - name: skip
   *         in: query
   *         description: The number of records to skip
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *       - name: limit
   *         in: query
   *         description: The maximum number of records to return
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 200
   *           default: 50
   *     responses:
   *       200:
   *         description: The list of friend requests for the user.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - data
   *                 - totalCount
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: "#/components/schemas/FriendRequest"
   *                 totalCount:
   *                   type: integer
   *                   minimum: 0
   *       400:
   *         description: The request was rejected because the query string was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not authorized to view the target user's friend requests.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request was rejected because the target user was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listFriendRequests(
    @TargetUser() user: User,
    @Query(new ZodValidator(ListFriendRequestsParamsSchema))
    options: ListFriendRequestsParamsDTO,
  ): Promise<ApiList<FriendRequestDTO>> {
    const results = await this.friendsService.listFriendRequests({
      ...options,
      userId: user.id,
    });

    return results;
  }

  /**
   * @openapi
   * /api/users/{username}/friendRequests/{friend}:
   *   get:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: Get friend request
   *     operationId: getFriendRequest
   *     description: |
   *       Gets a friend request.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *     responses:
   *       200:
   *         description: The friend request.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/FriendRequest"
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not authorized to view the target user's friend requests.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request was rejected because the target user or friend request was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get(`:${FriendParam}`)
  @UseGuards(AssertFriend)
  async getFriendRequest(
    @TargetUser() user: User,
    @TargetFriend() friend: User,
  ): Promise<FriendRequestDTO> {
    const friendRequest = await this.friendsService.getFriendRequest(
      user.id,
      friend.id,
    );

    if (!friendRequest) {
      throw new NotFoundException(
        `Unable to find friend request from ${user.username} to ${friend.username}.`,
      );
    }

    return friendRequest;
  }

  /**
   * @openapi
   * /api/users/{username}/friendRequests/{friend}:
   *   put:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: Send friend request
   *     operationId: sendFriendRequest
   *     description: |
   *       Sends a friend request to a user.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *     responses:
   *       201:
   *         description: The friend request was sent successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/FriendRequest"
   *       400:
   *         description: The request was rejected because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not authorized to send friend requests to the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request was rejected because the target user was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(`:${FriendParam}`)
  @HttpCode(201)
  @UseGuards(AssertFriend)
  async sendFriendRequest(
    @TargetUser() user: User,
    @TargetFriend() friend: User,
  ): Promise<FriendRequestDTO> {
    this.log.debug(
      `Sending friend request from ${user.username} to ${friend.username}...`,
    );
    const result = await this.friendsService.createFriendRequest(user, friend);

    const event: FriendRequestEvent = {
      key: EventKey.FriendRequestCreated,
      friend,
      user,
      friendRequest: result,
    };
    this.events.emit(event);

    return result;
  }

  /**
   * @openapi
   * /api/users/{username}/friendRequests/{friend}/acknowledge:
   *   post:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: Acknowledge friend request
   *     operationId: acknowledgeFriendRequest
   *     description: |
   *       Acknowledges (accepts or declines) a friend request. An optional reason can be provided on decline.
   *       The request being acknowledged would need to have been made from `{friend}` to `{username}`.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *     requestBody:
   *       description: |
   *         The friend request acknowledgement.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - accepted
   *             properties:
   *               accepted:
   *                 type: boolean
   *                 description: Indicates whether the friend request is accepted (`true`) or declined (`false`).
   *                 example: false
   *               reason:
   *                 type: string
   *                 description: |
   *                   A user-provided reason for declining the friend request. This value is only permitted in the case
   *                   where `accepted` is `false`.
   *                 example: "I don't know you, and you might be a jerk."
   *     responses:
   *       204:
   *         description: The friend request was acknowledged successfully.
   *       400:
   *         description: The request was rejected because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not authorized to acknowledge friend requests to the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request was rejected because the target user or friend request was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post(`:${FriendParam}/acknowledge`)
  @HttpCode(204)
  @UseGuards(AssertFriend)
  async acknowledgeFriendRequest(
    @TargetUser() user: User,
    @TargetFriend() friend: User,
    @Body(new ZodValidator(AcknowledgeFriendRequestParamsSchema))
    params: AcknowledgeFriendRequestParamsDTO,
  ): Promise<void> {
    this.log.log(
      `Acknowledging friend request from ${friend.username} to ${
        user.username
      }: ${params.accepted ? 'accept' : 'reject'}.`,
    );

    let friendRequest: FriendRequestDTO | undefined;
    if (params.accepted) {
      friendRequest = await this.friendsService.acceptFriendRequest(
        friend.id,
        user.id,
      );
    } else {
      friendRequest = await this.friendsService.rejectFriendRequest(
        friend.id,
        user.id,
        params.reason,
      );
    }

    if (!friendRequest) {
      throw new NotFoundException(
        'Unable to acknowledge friend request. Friend request was not found',
      );
    }

    const event: FriendRequestEvent = {
      friend,
      user,
      friendRequest,
      key: params.accepted
        ? EventKey.FriendRequestAccepted
        : EventKey.FriendRequestRejected,
    };
    this.events.emit(event);
  }

  /**
   * @openapi
   * /api/users/{username}/friendRequests/{friend}:
   *   delete:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: Cancel/delete friend request
   *     operationId: cancelFriendRequest
   *     description: |
   *       Cancels and deletes a request that has not yet been acknowledged or deletes a request that has already been acknowledged.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *     responses:
   *       204:
   *         description: The friend request was cancelled or deleted successfully.
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not authorized to cancel/delete friend requests to the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request was rejected because the target user or friend request was not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(`:${FriendParam}`)
  @HttpCode(204)
  @UseGuards(AssertFriend)
  async cancelFriendRequest(
    @TargetUser() user: User,
    @TargetFriend() friend: User,
  ): Promise<void> {
    const success = await this.friendsService.cancelFriendRequest(
      user.id,
      friend.id,
    );

    if (!success) {
      throw new NotFoundException('Friend request was not found');
    }
  }
}
