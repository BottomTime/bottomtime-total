import { Module } from '@nestjs/common';

import { AWSModule } from '../dependencies';
import { NotificationsModule } from '../notifications';
import { EmailEventsHandler } from './email-events.handler';

@Module({
  imports: [AWSModule, NotificationsModule],
  providers: [EmailEventsHandler],
})
export class EmailModule {}
