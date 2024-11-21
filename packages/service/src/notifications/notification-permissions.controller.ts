import { Controller, Inject } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Controller(
  'api/users/:username/notifications/permissions/:notificationType(email|pushNotification)',
)
export class NotificationPermissionsController {
  constructor(
    @Inject(NotificationsService)
    private readonly service: NotificationsService,
  ) {}

  getWhitelist() {}

  saveWhitelist() {}

  resetWhitelist() {}
}
