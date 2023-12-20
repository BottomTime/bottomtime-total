import { Module } from '@nestjs/common';
import { TanksService } from './tanks.service';
import { TanksController } from './tanks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TankSchema } from '../schemas';
import { Collections } from '../data';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collections.Tanks, schema: TankSchema },
    ]),
  ],
  providers: [TanksService],
  controllers: [TanksController],
})
export class TanksModule {}
