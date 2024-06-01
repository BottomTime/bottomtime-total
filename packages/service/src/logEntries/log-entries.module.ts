import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogEntryAirEntity, LogEntryEntity } from '../data';
import { DiveSitesModule } from '../diveSites';
import { FriendsModule } from '../friends';
import { UsersModule } from '../users';
import { LogEntriesService } from './log-entries.service';
import { LogEntryFactory } from './log-entry-factory';
import { UserLogEntriesController } from './user-log-entries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogEntryEntity, LogEntryAirEntity]),
    UsersModule,
    FriendsModule,
    DiveSitesModule,
  ],
  providers: [LogEntriesService, LogEntryFactory],
  controllers: [UserLogEntriesController],
  exports: [LogEntriesService, LogEntryFactory],
})
export class LogEntriesModule {}
