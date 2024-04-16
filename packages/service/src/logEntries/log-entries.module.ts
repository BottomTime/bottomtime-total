import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogEntryEntity, UserEntity } from '../data';
import { UsersModule } from '../users';
import { LogEntriesService } from './log-entries.service';
import { UserLogEntriesController } from './user-log-entries.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LogEntryEntity, UserEntity]),
    UsersModule,
  ],
  providers: [LogEntriesService],
  controllers: [UserLogEntriesController],
})
export class LogEntriesModule {}
