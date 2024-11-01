import { Module } from '@nestjs/common';

import { AWSModule } from '../dependencies';
import { EmailNotificationsHandler } from './email-notifications.handler';
import { EventsService } from './events.service';

@Module({
  imports: [AWSModule],
  providers: [EventsService, EmailNotificationsHandler],
  exports: [EventsService],
})
export class EventsModule {}
