import {
  CreateOrUpdateNotificationParamsDTO,
  CreateOrUpdateNotificationParamsSchema,
  ListNotificationsParamsDTO,
  ListNotificationsResponseDTO,
  NotificationDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { TargetUser } from './assert-target-user.guard';
import { NotificationsService } from './notifications.service';
import { User } from './user';

const UsernameParam = 'username';
const NotificationIdParam = ':notificationId';

@Controller(`api/users/:${UsernameParam}/notifications`)
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly service: NotificationsService,
  ) {}

  /**
   * @openapi
   * /api/users/{username}/notifications:
   *   get:
   *     summary: List notifications
   *     description: List notifications for a user.
   *     operationId: listNotifications
   *     tags:
   *       - Notifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - in: query
   *         name: showDismissed
   *         schema:
   *           type: boolean
   *         description: Whether to include dismissed notifications.
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           min: 0
   *           default: 50
   *         description: The number of notifications to skip.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           min: 1
   *           max: 200
   *           default: 50
   *         description: The maximum number of notifications to return.
   *     responses:
   *       "200":
   *         description: The request succeeded and a list of notifications will be returned in the request body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - notifications
   *                 - totalCount
   *               properties:
   *                 notifications:
   *                   type: array
   *                   items:
   *                     $ref: "#/components/schemas/Notification"
   *                 totalCount:
   *                   type: integer
   *                   minimum: 0
   *                   description: The total number of notifications.
   *                   example: 7
   *       "400":
   *         description: The request failed because the query string parameters were invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view notifications for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  async listNotifications(
    @TargetUser() user: User,
    @Body() options: ListNotificationsParamsDTO,
  ): Promise<ListNotificationsResponseDTO> {
    return {
      notifications: [],
      totalCount: 0,
    };
  }

  /**
   * @openapi
   * /api/users/{username}/notifications:
   *   post:
   *     summary: Create a new notification
   *     description: Create a new notification for a user.
   *     operationId: createNotification
   *     tags:
   *       - Notifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateNotification"
   *     responses:
   *       "200":
   *         description: The request succeeded and the notification was created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Notification"
   *       "400":
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the current user is not authorized to create notifications for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  async createNofitication(
    @TargetUser() user: User,
    @Body() options: CreateOrUpdateNotificationParamsDTO,
  ): Promise<NotificationDTO> {
    throw new Error('Not implemented');
  }

  /**
   * @openapi
   * /api/users/{username}/notifications/{notificationId}:
   *   put:
   *     summary: Update a notification
   *     description: Update an existing notification for a user.
   *     operationId: updateNotification
   *     tags:
   *       - Notifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/NotificationId"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateOrUpdateNotification"
   *     responses:
   *       "200":
   *         description: The request succeeded and the notification was updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Notification"
   *       "400":
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the current user is not authorized to update the notification for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or notification could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Put(NotificationIdParam)
  async updateNotification(
    @TargetUser() user: User,
    @Body() options: CreateOrUpdateNotificationParamsDTO,
  ): Promise<NotificationDTO> {
    throw new Error('Not implemented');
  }

  /**
   * @openapi
   * /api/users/{username}/notifications/{notificationId}:
   *   delete:
   *     summary: Delete a notification
   *     description: Delete a notification for a user.
   *     operationId: deleteNotification
   *     tags:
   *       - Notifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/NotificationId"
   *     responses:
   *       "204":
   *         description: The request succeeded and the notification was deleted successfully.
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the current user is not authorized to delete the notification for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or notification could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Delete(NotificationIdParam)
  deleteNotification() {}

  /**
   * @openapi
   * /api/users/{username}/notifications/{notificationId}/dismiss:
   *   post:
   *     summary: Dismiss a notification
   *     description: |
   *       Dismiss a notification for a user. (This will also set an expiration date on the notification so that it is
   *       automatically removed at some point in the future.)
   *     operationId: dismissNotification
   *     tags:
   *       - Notifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/NotificationId"
   *     responses:
   *       "204":
   *         description: The request succeeded and the notification was dismissed successfully.
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the current user is not authorized to dismiss the notification for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or notification could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post(`${NotificationIdParam}/dismiss`)
  dismissNotification() {}

  /**
   * @openapi
   * /api/users/{username}/notifications/{notificationId}/undismiss:
   *   post:
   *     summary: Undismiss a notification
   *     description: |
   *       Undismiss a notification for a user. The notification will once again appear as new to the user.
   *     operationId: undismissNotification
   *     tags:
   *       - Notifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/NotificationId"
   *     responses:
   *       "204":
   *         description: The request succeeded and the notification was undismissed successfully.
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the current user is not authorized to undismiss the notification for the target user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: The request failed because the target user or notification could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: The request failed because of an unexpected internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post(`${NotificationIdParam}/undismiss`)
  undismissNotification() {}
}
