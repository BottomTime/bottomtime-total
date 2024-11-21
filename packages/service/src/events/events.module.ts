import { Module } from '@nestjs/common';

import { AWSModule } from '../dependencies';
import { EventsService } from './events.service';

@Module({
  imports: [AWSModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
