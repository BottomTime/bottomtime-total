import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import {
  AcknowledgeFriendRequestParamsDTO,
  AcknowledgeFriendRequestParamsSchema,
  FriendRequestDTO,
  ListFriendRequestsParams,
  ListFriendRequestsParamsSchema,
  ListFriendRequestsResponseDTO,
} from '@bottomtime/api';
import { ZodValidator } from '../zod-validator';
import { AssertAuth } from '../auth';
import { AssertTargetUser, TargetUser, User } from '../users';
import { AssertFriendshipOwner } from './assert-friendship-owner.guard';
import { AssertFriend, TargetFriend } from './assert-friend.guard';

const UsernameParam = 'username';
const FriendParam = 'friend';

@Controller(`api/users/:${UsernameParam}/friendRequests`)
@UseGuards(AssertAuth, AssertTargetUser, AssertFriendshipOwner)
export class FriendRequestsController {
  private readonly log: Logger = new Logger(FriendRequestsController.name);

  constructor(private readonly friendsService: FriendsService) {}

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
   *                 - friendRequests
   *                 - totalCount
   *               properties:
   *                 friendRequests:
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
    options: ListFriendRequestsParams,
  ): Promise<ListFriendRequestsResponseDTO> {
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
   *     requestBody:
   *       description: |
   *         The friend request to send.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/FriendRequest"
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
    const result = await this.friendsService.createFriendRequest(
      user.id,
      friend.id,
    );
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
   *       Acknowledges a friend request.
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
   *             $ref: "#/components/schemas/AcknowledgeFriendRequestParams"
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
    let success: boolean;

    if (params.accepted) {
      success = await this.friendsService.acceptFriendRequest(
        user.id,
        friend.id,
      );
    } else {
      success = await this.friendsService.rejectFriendRequest(
        user.id,
        friend.id,
        params.reason,
      );
    }

    if (!success) {
      throw new NotFoundException('Friend request was not found');
    }
  }

  /**
   * @openapi
   * /api/users/{username}/friendRequests/{friend}:
   *   delete:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: Cancel friend request
   *     operationId: cancelFriendRequest
   *     description: |
   *       Cancels a friend request.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *     responses:
   *       204:
   *         description: The friend request was cancelled successfully.
   *       401:
   *         description: The request was rejected because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request was rejected because the user is not authorized to cancel friend requests to the target user.
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
