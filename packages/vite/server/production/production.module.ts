import { Module } from '@nestjs/common';

import { JwtModule } from '../jwt';
import { ProductionService } from './production.service';
import { ProductionController } from './web.controller';

@Module({
  imports: [JwtModule],
  providers: [ProductionService],
  controllers: [ProductionController],
})
export class ProductionModule {}
