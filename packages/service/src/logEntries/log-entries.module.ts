import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  LogEntrySampleEntity,
} from '../data';
import { RedisCacheConfigService, RedisModule } from '../dependencies';
import { DiveSitesModule } from '../diveSites';
import { FeaturesModule } from '../features';
import { FriendsModule } from '../friends';
import { UsersModule } from '../users';
import { Importer } from './import/importer';
import { LogEntryImportFactory } from './import/log-entry-import-factory';
import { LogEntryImportController } from './import/log-entry-import.controller';
import { LogEntryImportService } from './import/log-entry-import.service';
import { LogEntryImportsController } from './import/log-entry-imports.controller';
import { LogEntriesService } from './log-entries.service';
import { LogEntryFactory } from './log-entry-factory';
import { LogEntrySampleController } from './log-entry-sample.controller';
import { UserLogEntriesController } from './user-log-entries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LogEntryEntity,
      LogEntryAirEntity,
      LogEntrySampleEntity,
      LogEntryImportEntity,
      LogEntryImportRecordEntity,
    ]),
    CacheModule.registerAsync({
      imports: [RedisModule],
      useExisting: RedisCacheConfigService,
    }),
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
    Importer,
  ],
  controllers: [
    UserLogEntriesController,
    LogEntrySampleController,
    LogEntryImportsController,
    LogEntryImportController,
  ],
  exports: [LogEntriesService, LogEntryFactory],
})
export class LogEntriesModule {}
