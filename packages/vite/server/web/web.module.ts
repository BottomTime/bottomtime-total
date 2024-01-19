import { Module } from '@nestjs/common';
import { WebService } from './web.service';
import { WebController } from './web.controller';

@Module({
  providers: [WebService],
  controllers: [WebController],
})
export class WebModule {}
