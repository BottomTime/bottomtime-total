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
import { LogEntryImportFactory } from './import/log-entry-import-factory';
import { LogEntryImportController } from './import/log-entry-import.controller';
import { LogEntryImportService } from './import/log-entry-import.service';
import { LogEntryImportsController } from './import/log-entry-imports.controller';
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
  controllers: [
    UserLogEntriesController,
    LogEntryImportsController,
    LogEntryImportController,
  ],
  exports: [LogEntriesService, LogEntryFactory],
})
export class LogEntriesModule {}
