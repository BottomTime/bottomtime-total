import { Module } from '@nestjs/common';

import { EmailNotificationsHandler } from './email-notifications.handler';
import { EventsService } from './events.service';

@Module({
  providers: [EventsService, EmailNotificationsHandler],
  exports: [EventsService],
})
export class EventsModule {}
