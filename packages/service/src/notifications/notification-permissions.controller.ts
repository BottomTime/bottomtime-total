import { NotificationType } from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { z } from 'zod';

import {
  AssertAccountOwner,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
  User,
} from '../users';
import { ZodValidator } from '../zod-validator';
import { AssertNotificationsFeature } from './assert-notifications-feature.guard';
import { NotificationsService } from './notifications.service';

const NotificationTypeParam = 'notificationType';

@Controller(
  `api/users/:username/notifications/permissions/:${NotificationTypeParam}(email|pushNotification)`,
)
@UseGuards(
  AssertNotificationsFeature,
  AssertAuth,
  AssertTargetUser,
  AssertAccountOwner,
)
export class NotificationPermissionsController {
  private readonly log = new Logger(NotificationPermissionsController.name);

  constructor(
    @Inject(NotificationsService)
    private readonly service: NotificationsService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/notifications/permissions/{notificationType}:
   *   get:
   *     tags:
   *       - Notifications
   *       - Users
   *       - Experimental
   *     summary: List whitelisted notification events
   *     operationId: getWhitelistedNotifications
   *     description: |
   *       Returns an array of the **whitelisted** notification events for the specified
   *       user and notification type. An empty array indicates that **no** events are whitelisted
   *       and the user will not receive any notifications. A wildcard `*` can be used to match
   *       entire categories or all events.
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/NotificationType"
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the whitelisted events will be returned as an
   *           array of strings in the response body.
   *         content:
   *           application/json:
   *             description: An array of whitelisted notification events.
   *             required: true
   *             schema:
   *               type: array
   *               items:
   *                 type: string
   *               example: ["friendRequest.*", "membership.*", "user.created"]
   *       "401":
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the calling user is not authorized to view the
   *           notifications whitelist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *         $ref: "#/components/responses/ForbiddenError"
   *       "404":
   *         description: The request failed because the target user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because an unexpected server error occurred.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async getWhitelist(
    @TargetUser() user: User,
    @Param(NotificationTypeParam) notificationType: NotificationType,
  ): Promise<string[]> {
    const whitelist = await this.service.getNotificationWhitelist(
      user,
      notificationType,
    );
    return Array.from(whitelist);
  }

  /**
   * @openapi
   * /api/users/{username}/notifications/permissions/{notificationType}:
   *   put:
   *     tags:
   *       - Notifications
   *       - Users
   *       - Experimental
   *     summary: Update whitelisted notification events
   *     operationId: updateWhitelistedNotifications
   *     description: |
   *       Updates the list of **whitelisted** notification events for the specified user and notification type.
   *       The request body must be an array of strings, where each string is a valid event key that the user should
   *       receive notifications for. An empty array indicates that **no** events are whitelisted and the user will
   *       not receive any notifications. A wildcard `*` can be used to match entire categories or all events.
   *       (E.g. `friendRequest.*` would match all friend request events keys.)
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/NotificationType"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               type: string
   *             example: ["friendRequest.*", "membership.*", "user.created"]
   *     responses:
   *       "204":
   *         description: The request succeeded and the notification whitelist has been updated.
   *       "400":
   *         description: |
   *           The request failed because the request body was not a valid array of strings or the event keys
   *           were not valid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the calling user is not authorized to update the notifications whitelist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *         $ref: "#/components/responses/ForbiddenError"
   *       "404":
   *         description: The request failed because the target user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because an unexpected server error occurred.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async saveWhitelist(
    @TargetUser() user: User,
    @Param(NotificationTypeParam) notificationType: NotificationType,
    @Body(new ZodValidator(z.string().array())) eventKeys: string[],
  ): Promise<void> {
    await this.service.updateNotificationWhitelist(
      user,
      notificationType,
      new Set(eventKeys),
    );
  }

  /**
   * @openapi
   * /api/users/{username}/notifications/permissions/{notificationType}:
   *   delete:
   *     tags:
   *       - Notifications
   *       - Users
   *       - Experimental
   *     summary: Reset whitelisted notification events
   *     operationId: resetWhitelistedNotifications
   *     description: |
   *       Resets the list of **whitelisted** notification events for the specified user and notification type.
   *       This will reset the user's whitelist to `['*']` (receive all notifications).
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/NotificationType"
   *     responses:
   *       "204":
   *         description: The request succeeded and the notification whitelist has been reset.
   *       "401":
   *         description: The request failed because the user could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the calling user is not authorized to update the notifications whitelist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *         $ref: "#/components/responses/ForbiddenError"
   *       "404":
   *         description: The request failed because the target user does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because an unexpected server error occurred.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetWhitelist(
    @TargetUser() user: User,
    @Param(NotificationTypeParam) notificationType: NotificationType,
  ): Promise<void> {
    await this.service.removeNotificationWhitelist(user, notificationType);
    this.log.log(
      `User "${user.username}" has reset their notifications whitelist for ${notificationType} notifications`,
    );
  }
}
