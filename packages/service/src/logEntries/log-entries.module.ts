import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogEntryEntity } from '../data';
import { LogEntriesController } from './log-entries.controller';
import { LogEntriesService } from './log-entries.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntryEntity])],
  providers: [LogEntriesService],
  controllers: [LogEntriesController],
})
export class LogEntriesModule {}
