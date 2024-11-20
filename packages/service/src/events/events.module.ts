import { Module } from '@nestjs/common';

import { AWSModule } from '../dependencies';
import { EmailEventsHandler } from './email-events.handler';
import { EventsService } from './events.service';

@Module({
  imports: [AWSModule],
  providers: [EventsService, EmailEventsHandler],
  exports: [EventsService],
})
export class EventsModule {}
