import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSource, DataSourceOptions } from 'typeorm';

import { AdminModule } from './admin';
import { AlertsModule } from './alerts';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DiveSiteEntity, LogEntryEntity, UserEntity } from './data';
import { PostgresDataSourceOptions } from './data-source';
import { DiveSitesModule } from './diveSites/dive-sites.module';
import { FriendsModule } from './friends';
import { LogEntriesModule } from './logEntries';
import { MembershipModule } from './membership';
import { DiveOperatorsModule } from './operators';
import { TanksModule } from './tanks/tanks.module';
import { UsersModule } from './users';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      delimiter: '_',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => PostgresDataSourceOptions,
      dataSourceFactory: async (options?: DataSourceOptions) => {
        const ds = new DataSource(options ?? PostgresDataSourceOptions);
        return await ds.initialize();
      },
    }),
    PassportModule.register({
      session: false,
    }),

    TypeOrmModule.forFeature([UserEntity, DiveSiteEntity, LogEntryEntity]),

    AlertsModule,
    AdminModule,
    AuthModule,
    DiveOperatorsModule,
    DiveSitesModule,
    FriendsModule,
    LogEntriesModule,
    MembershipModule,
    TanksModule,
    UsersModule,
  ],

  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}
