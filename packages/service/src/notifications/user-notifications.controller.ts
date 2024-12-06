import {
  ApiList,
  CreateOrUpdateNotificationParamsDTO,
  CreateOrUpdateNotificationParamsSchema,
  ListNotificationsParamsDTO,
  ListNotificationsParamsSchema,
  NotificationDTO,
  TotalCountDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UuidRegex } from '../common';
import {
  AssertAdmin,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
} from '../users/guards';
import { AssertAccountOwner } from '../users/guards/assert-account-owner.guard';
import { User } from '../users/user';
import { ValidateIds } from '../validate-ids.guard';
import { ZodValidator } from '../zod-validator';
import { AssertNotificationsFeature } from './assert-notifications-feature.guard';
import {
  AssertTargetNotification,
  TargetNotification,
} from './assert-target-notification.guard';
import { Notification } from './notification';
import { NotificationsService } from './notifications.service';

const UsernameParam = 'username';
const NotificationIdParamName = 'notificationId';
const NotificationIdParam = `:${NotificationIdParamName}(${UuidRegex})`;

@Controller(`api/users/:${UsernameParam}/notifications`)
@UseGuards(
  AssertNotificationsFeature,
  AssertAuth,
  AssertTargetUser,
  AssertAccountOwner,
)
export class UserNotificationsController {
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
   *         name: showAfter
   *         schema:
   *           type: string
   *           format: date-time
   *         description: The date after which notifications should be shown. (Earlier notifications will be filtered out.)
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 50
   *         description: The number of notifications to skip.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 200
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
   *                 - data
   *                 - totalCount
   *               properties:
   *                 data:
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
    @Query(new ZodValidator(ListNotificationsParamsSchema))
    options: ListNotificationsParamsDTO,
  ): Promise<ApiList<NotificationDTO>> {
    const results = await this.service.listNotifications({
      ...options,
      user,
    });

    return {
      data: results.data.map((notification) => notification.toJSON()),
      totalCount: results.totalCount,
    };
  }

  /**
   * @openapi
   * /api/users/{username}/notifications/count:
   *   get:
   *     summary: Get notification count
   *     description: Get the total number of notifications for a user, matching a given search criteria.
   *     operationId: getNotificationCount
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
   *         name: showAfter
   *         schema:
   *           type: string
   *           format: date-time
   *         description: The date after which notifications should be shown. (Earlier notifications will be filtered out.)
   *     responses:
   *       "200":
   *         description: The request succeeded and the total number of notifications will be returned in the request body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - totalCount
   *               properties:
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
  @Get('count')
  async getNotificationCount(
    @TargetUser() user: User,
    @Query(new ZodValidator(ListNotificationsParamsSchema))
    options: ListNotificationsParamsDTO,
  ): Promise<TotalCountDTO> {
    const totalCount = await this.service.getNotificationsCount(user, options);
    return { totalCount };
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
  @UseGuards(AssertAdmin)
  async createNofitication(
    @TargetUser() user: User,
    @Body(new ZodValidator(CreateOrUpdateNotificationParamsSchema))
    options: CreateOrUpdateNotificationParamsDTO,
  ): Promise<NotificationDTO> {
    const notification = await this.service.createNotification({
      ...options,
      user,
    });

    return notification.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/notifications/{notificationId}:
   *   get:
   *     summary: Get a notification
   *     description: Get a single notification for a user.
   *     operationId: getNotification
   *     tags:
   *       - Notifications
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/NotificationId"
   *     responses:
   *       "200":
   *         description: The request succeeded and the notification will be returned in the request body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Notification"
   *       "401":
   *         description: The request failed because the request could not be authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: The request failed because the current user is not authorized to view the notification for the target user.
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
  @Get(NotificationIdParam)
  @UseGuards(ValidateIds(NotificationIdParamName), AssertTargetNotification)
  async getNotification(
    @TargetNotification() notification: Notification,
  ): Promise<NotificationDTO> {
    return notification.toJSON();
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
  @UseGuards(
    ValidateIds(NotificationIdParamName),
    AssertAdmin,
    AssertTargetNotification,
  )
  async updateNotification(
    @TargetNotification() notification: Notification,
    @Body(new ZodValidator(CreateOrUpdateNotificationParamsSchema))
    options: CreateOrUpdateNotificationParamsDTO,
  ): Promise<NotificationDTO> {
    notification.active = options.active ?? new Date();
    notification.expires = options.expires;
    notification.icon = options.icon;
    notification.message = options.message;
    notification.title = options.title;

    await notification.save();
    if (notification.dismissed) await notification.markDismissed(false);

    return notification.toJSON();
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
  @HttpCode(204)
  @UseGuards(
    ValidateIds(NotificationIdParamName),
    AssertAdmin,
    AssertTargetNotification,
  )
  async deleteNotification(
    @TargetNotification() notification: Notification,
  ): Promise<void> {
    await notification.delete();
  }

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
  @HttpCode(204)
  @UseGuards(ValidateIds(NotificationIdParamName), AssertTargetNotification)
  async dismissNotification(
    @TargetNotification() notification: Notification,
  ): Promise<void> {
    await notification.markDismissed(true);
  }

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
  @UseGuards(ValidateIds(NotificationIdParamName), AssertTargetNotification)
  @HttpCode(204)
  async undismissNotification(
    @TargetNotification() notifification: Notification,
  ): Promise<void> {
    await notifification.markDismissed(false);
  }
}
