import { Module } from '@nestjs/common';

import { JwtModule } from '../jwt';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';

@Module({
  imports: [JwtModule],
  providers: [ProductionService],
  controllers: [ProductionController],
})
export class ProductionModule {}
