import { Module } from '@nestjs/common';

import { EmailNotificationsHandler } from './email-notifications.handler';

@Module({
  providers: [EmailNotificationsHandler],
})
export class EventsModule {}
