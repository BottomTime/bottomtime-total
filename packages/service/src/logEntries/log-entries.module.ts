import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CertificationsModule } from '../certifications';
import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  LogEntrySampleEntity,
  LogEntrySignatureEntity,
} from '../data';
import { RedisCacheConfigService, RedisModule } from '../dependencies';
import { DiveSitesModule } from '../diveSites';
import { FeaturesModule } from '../features';
import { FriendsModule } from '../friends';
import { OperatorsModule } from '../operators';
import { UsersModule } from '../users';
import { Importer } from './import/importer';
import { LogEntryImportFactory } from './import/log-entry-import-factory';
import { LogEntryImportController } from './import/log-entry-import.controller';
import { LogEntryImportService } from './import/log-entry-import.service';
import { LogEntryImportsController } from './import/log-entry-imports.controller';
import { LogEntriesService } from './log-entries.service';
import { LogEntryFactory } from './log-entry-factory';
import { LogEntryReviewsController } from './log-entry-reviews.controller';
import { LogEntrySampleController } from './log-entry-sample.controller';
import { LogEntrySignatureFactory } from './log-entry-signature-factory';
import { LogEntrySignaturesService } from './log-entry-signatures.service';
import { UserLogEntriesController } from './user-log-entries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LogEntryEntity,
      LogEntryAirEntity,
      LogEntrySampleEntity,
      LogEntrySignatureEntity,
      LogEntryImportEntity,
      LogEntryImportRecordEntity,
    ]),
    CacheModule.registerAsync({
      imports: [RedisModule],
      useExisting: RedisCacheConfigService,
    }),
    UsersModule,
    CertificationsModule,
    FeaturesModule,
    FriendsModule,
    DiveSitesModule,
    OperatorsModule,
  ],
  providers: [
    LogEntryImportFactory,
    LogEntrySignatureFactory,
    LogEntrySignaturesService,
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
    LogEntryReviewsController,
  ],
  exports: [LogEntriesService, LogEntryFactory],
})
export class LogEntriesModule {}
