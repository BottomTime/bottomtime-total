import { Module } from '@nestjs/common';

import { AWSModule } from '../dependencies';
import { EmailEventsHandler } from './email-events.handler';

@Module({
  imports: [AWSModule],
  providers: [EmailEventsHandler],
})
export class EmailModule {}
