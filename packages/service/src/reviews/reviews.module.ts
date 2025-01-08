import { Module } from '@nestjs/common';

import { AWSModule } from '../dependencies';
import { ReviewEventsHandler } from './review-events.handler';

@Module({
  imports: [AWSModule],
  providers: [ReviewEventsHandler],
})
export class ReviewsModule {}
