import {
  ApiList,
  CreateOrUpdateNotificationParamsDTO,
  CreateOrUpdateNotificationParamsSchema,
  ListNotificationsParamsDTO,
  ListNotificationsParamsSchema,
  NotificationDTO,
  TotalCountDTO,
} from '@bottomtime/api';
import { EventKey } from '@bottomtime/common';

import {
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
  Query,
  UseGuards,
} from '@nestjs/common';

import { z } from 'zod';

import { UuidRegex } from '../common';
import { EventsService } from '../events';
import {
  AssertAdmin,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
} from '../users/guards';
import { AssertAccountOwner } from '../users/guards/assert-account-owner.guard';
import { User } from '../users/user';
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
const IdsList = z.string().uuid().array().min(1).max(500);

@Controller(`api/users/:${UsernameParam}/notifications`)
@UseGuards(
  AssertNotificationsFeature,
  AssertAuth,
  AssertTargetUser,
  AssertAccountOwner,
)
export class UserNotificationsController {
  private readonly log = new Logger(UserNotificationsController.name);

  constructor(
    @Inject(NotificationsService)
    private readonly service: NotificationsService,

    @Inject(EventsService)
    private readonly events: EventsService,
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
    this.log.debug('Listing notifications for user', options);
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
   * /api/users/{username}/notifications:
   *   delete:
   *     summary: Bulk delete notifications
   *     description: Delete a group of notifications for a user.
   *     operationId: bulkDeleteNotifications
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
   *             type: array
   *             items:
   *               type: string
   *               format: uuid
   *             minItems: 1
   *             maxItems: 500
   *             uniqueItems: true
   *           description: The IDs of the notifications to delete.
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
   *         description: The request failed because the current user is not authorized to delete notifications for the target user.
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
  @Delete()
  async deleteNotifications(
    @TargetUser() user: User,
    @Body(new ZodValidator(IdsList))
    ids: string[],
  ): Promise<TotalCountDTO> {
    const totalCount = await this.service.deleteNotifications(user, ids);
    this.events.emit({
      key: EventKey.NotificationsDeleted,
      user,
      notificationIds: ids,
    });
    return { totalCount };
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
   * /api/users/{username}/notifications/dismiss:
   *   post:
   *     summary: Dismiss notifications
   *     description: Dismiss a group of notifications for a user. (This will also set an expiration date on the notifications so that they are automatically removed at some point in the future.)
   *     operationId: bulkDismissNotifications
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
   *             type: array
   *             items:
   *               type: string
   *               format: uuid
   *             minItems: 1
   *             maxItems: 500
   *             uniqueItems: true
   *           description: The IDs of the notifications to dismiss.
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
   *         description: The request failed because the current user is not authorized to dismiss notifications for the target user.
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
  @Post('dismiss')
  @HttpCode(HttpStatus.OK)
  async dismissNotifications(
    @TargetUser() user: User,
    @Body(new ZodValidator(IdsList))
    ids: string[],
  ): Promise<TotalCountDTO> {
    const totalCount = await this.service.dismissNotifications(user, ids);
    this.events.emit({
      key: EventKey.NotificationsDismissed,
      user,
      notificationIds: ids,
    });
    return { totalCount };
  }

  /**
   * @openapi
   * /api/users/{username}/notifications/undismiss:
   *   post:
   *     summary: Undismiss notifications
   *     description: Undismiss a group of notifications for a user. The notifications will once again appear as new to the user.
   *     operationId: bulkUndismissNotifications
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
   *             type: array
   *             items:
   *               type: string
   *               format: uuid
   *             minItems: 1
   *             maxItems: 500
   *             uniqueItems: true
   *           description: The IDs of the notifications to undismiss.
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
   *         description: The request failed because the current user is not authorized to undismiss notifications for the target user.
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
  @Post('undismiss')
  @HttpCode(HttpStatus.OK)
  async undismissNotifications(
    @TargetUser() user: User,
    @Body(new ZodValidator(IdsList))
    ids: string[],
  ): Promise<TotalCountDTO> {
    const totalCount = await this.service.undismissNotifications(user, ids);
    this.events.emit({
      key: EventKey.NotificationsUndismissed,
      user,
      notificationIds: ids,
    });
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
  @UseGuards(AssertTargetNotification)
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
  @UseGuards(AssertAdmin, AssertTargetNotification)
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
  @UseGuards(AssertTargetNotification)
  async deleteNotification(
    @TargetUser() user: User,
    @TargetNotification() notification: Notification,
  ): Promise<void> {
    await notification.delete();
    this.events.emit({
      key: EventKey.NotificationsDeleted,
      user,
      notificationIds: [notification.id],
    });
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
  @UseGuards(AssertTargetNotification)
  async dismissNotification(
    @TargetUser() user: User,
    @TargetNotification() notification: Notification,
  ): Promise<void> {
    await notification.markDismissed(true);
    this.events.emit({
      key: EventKey.NotificationsDismissed,
      user,
      notificationIds: [notification.id],
    });
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
  @UseGuards(AssertTargetNotification)
  @HttpCode(204)
  async undismissNotification(
    @TargetUser() user: User,
    @TargetNotification() notifification: Notification,
  ): Promise<void> {
    await notifification.markDismissed(false);
    this.events.emit({
      key: EventKey.NotificationsUndismissed,
      user,
      notificationIds: [notifification.id],
    });
  }
}
