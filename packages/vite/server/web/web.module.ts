import { Module } from '@nestjs/common';
import { WebService } from './web.service';
import { WebController } from './web.controller';
import { JwtModule } from '../jwt';

@Module({
  imports: [JwtModule],
  providers: [WebService],
  controllers: [WebController],
})
export class WebModule {}
