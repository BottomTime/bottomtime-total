import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
} from '../data';
import { DiveSitesModule } from '../diveSites';
import { FeaturesModule } from '../features';
import { FriendsModule } from '../friends';
import { UsersModule } from '../users';
import { ImportController } from './import/import.controller';
import { ImportsController } from './import/imports.controller';
import { LogEntryImportFactory } from './import/log-entry-import-factory';
import { LogEntryImportService } from './import/log-entry-import.service';
import { LogEntriesService } from './log-entries.service';
import { LogEntryFactory } from './log-entry-factory';
import { UserLogEntriesController } from './user-log-entries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LogEntryEntity,
      LogEntryAirEntity,
      LogEntryImportEntity,
    ]),
    UsersModule,
    FeaturesModule,
    FriendsModule,
    DiveSitesModule,
  ],
  providers: [
    LogEntryImportFactory,
    LogEntriesService,
    LogEntryFactory,
    LogEntryImportService,
  ],
  controllers: [UserLogEntriesController, ImportsController, ImportController],
  exports: [LogEntriesService, LogEntryFactory],
})
export class LogEntriesModule {}
