import {
  FriendDTO,
  ListFriendsParams,
  ListFriendsParamsSchema,
  ListFriendsResponseDTO,
} from '@bottomtime/api';

import {
  Controller,
  Delete,
  Get,
  Head,
  HttpCode,
  Inject,
  Logger,
  NotFoundException,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { AssertAuth, AssertTargetUser, TargetUser, User } from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertFriend, TargetFriend } from './assert-friend.guard';
import { AssertFriendshipOwner } from './assert-friendship-owner.guard';
import { FriendsService } from './friends.service';

const UsernameParam = 'username';
const FriendParam = 'friend';

@Controller(`api/users/:${UsernameParam}/friends`)
@UseGuards(AssertAuth, AssertTargetUser, AssertFriendshipOwner)
export class FriendsController {
  private readonly log: Logger = new Logger(FriendsController.name);

  constructor(
    @Inject(FriendsService) private readonly friendsService: FriendsService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/friends:
   *   get:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: List friends of a user
   *     operationId: listFriends
   *     description: |
   *       Lists the friends of a user.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - name: sortBy
   *         in: query
   *         description: The field to sort by
   *         schema:
   *           type: string
   *           enum:
   *             - username
   *             - memberSince
   *             - friendsSince
   *           default: friendsSince
   *       - name: sortOrder
   *         in: query
   *         description: The sort order
   *         schema:
   *           type: string
   *           enum:
   *             - asc
   *             - desc
   *           default: desc
   *       - name: skip
   *         in: query
   *         description: The number of results to skip over.
   *         schema:
   *           type: integer
   *           format: int32
   *           default: 0
   *       - name: limit
   *         in: query
   *         description: The maximum number of results to return.
   *         schema:
   *           type: integer
   *           format: int32
   *           default: 100
   *     responses:
   *       200:
   *         description: List of friends
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - friends
   *                 - totalCount
   *               properties:
   *                 friends:
   *                   type: array
   *                   items:
   *                     $ref: "#/components/schemas/FriendWithFriendsSince"
   *                 totalCount:
   *                   type: integer
   *                   format: int32
   *                   description: The total number of friends.
   *                   example: 2
   *       400:
   *         description: The request failed because the query string parameters were invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the current user is not authorized to view the target user's friends.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user was not found.
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
  async listFriends(
    @TargetUser() user: User,
    @Query(new ZodValidator(ListFriendsParamsSchema))
    options: ListFriendsParams,
  ): Promise<ListFriendsResponseDTO> {
    this.log.debug(
      `Executing query for friends of user ${user.username} with query options:`,
      options,
    );

    return this.friendsService.listFriends({
      ...options,
      userId: user.id,
    });
  }

  /**
   * @openapi
   * /api/users/{username}/friends/{friend}:
   *   head:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: Check if two users are friends
   *     operationId: areFriends
   *     description: |
   *       Checks if two users are friends. Returns an HTTP 200 if they are friends, or a 404 if they are not friends.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *     responses:
   *       200:
   *         description: The users are friends.
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the current user is not authorized to view the target user's friends.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The users are not friends.
   *       500:
   *         description: The request failed due to an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Head(`:${FriendParam}`)
  @UseGuards(AssertFriend)
  async areFriends(
    @TargetUser() user: User,
    @TargetFriend() friend: User,
    @Res() res: Response,
  ): Promise<void> {
    const areFriends = await this.friendsService.areFriends(user.id, friend.id);
    res.sendStatus(areFriends ? 200 : 404);
  }

  /**
   * @openapi
   * /api/users/{username}/friends/{friend}:
   *   get:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: Get a friend
   *     operationId: getFriend
   *     description: |
   *       Gets a friend of a user.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *     responses:
   *       200:
   *         description: The request succeeded and the data will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/FriendWithFriendsSince"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the current user is not authorized to view the target user's friends.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user or friend was not found.
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
  async getFriend(
    @TargetUser() user: User,
    @TargetFriend() friend: User,
  ): Promise<FriendDTO> {
    const friendData = await this.friendsService.getFriend(user.id, friend.id);
    if (!friendData) {
      throw new NotFoundException('Users are not friends.');
    }

    return friendData;
  }

  /**
   * @openapi
   * /api/users/{username}/friends/{friend}:
   *   delete:
   *     tags:
   *       - Friends
   *       - Users
   *     summary: Remove a friend
   *     operationId: removeFriend
   *     description: |
   *       Removes a friend from a user's friends list.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/FriendUsername"
   *     responses:
   *       204:
   *         description: The request succeeded and the friend was removed.
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the current user is not authorized to remove the target user's friend.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user or friend was not found.
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
  async removeFriend(
    @TargetUser() user: User,
    @TargetFriend() friend: User,
  ): Promise<void> {
    const result = await this.friendsService.unFriend(user.id, friend!.id);
    if (!result) {
      throw new NotFoundException('Users are not friends.');
    }
  }
}
