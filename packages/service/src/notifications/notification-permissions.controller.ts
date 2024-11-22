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
