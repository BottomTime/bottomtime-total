import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { Config } from '../config';
import { JwtModule } from '../jwt';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';

@Module({
  imports: [
    JwtModule,
    HttpModule.register({
      baseURL: Config.apiUrl,
    }),
  ],
  providers: [DevService],
  controllers: [DevController],
})
export class DevModule {}
