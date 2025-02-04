import { HttpModule } from '@nestjs/axios';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import helmet from 'helmet';
import { DataSource, DataSourceOptions } from 'typeorm';

import { AdminModule } from './admin';
import { AlertsModule } from './alerts';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CertificationsModule } from './certifications';
import { DiveSiteEntity, LogEntryEntity, UserEntity } from './data';
import { PostgresDataSourceOptions } from './data-source';
import { RedisModule } from './dependencies';
import { DiveSitesModule } from './diveSites/dive-sites.module';
import { EmailModule } from './email';
import { EventsModule } from './events';
import { FriendsModule } from './friends';
import { GeolocationMiddleware } from './geolocation.middleware';
import { LogRequestMiddleware } from './log-request.middleware';
import { LogEntriesModule } from './logEntries';
import { MembershipModule } from './membership';
import { NotificationsModule } from './notifications';
import { OperatorsModule } from './operators';
import { ReviewsModule } from './reviews';
import { TanksModule } from './tanks/tanks.module';
import { UsersModule } from './users';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => PostgresDataSourceOptions,
      dataSourceFactory: async (options?: DataSourceOptions) => {
        const ds = new DataSource(options ?? PostgresDataSourceOptions);
        return await ds.initialize();
      },
    }),
    HttpModule.register({}),
    PassportModule.register({
      session: false,
    }),
    RedisModule,
    EventsModule,

    TypeOrmModule.forFeature([UserEntity, DiveSiteEntity, LogEntryEntity]),

    AlertsModule,
    AdminModule,
    AuthModule,
    CertificationsModule,
    DiveSitesModule,
    EmailModule,
    FriendsModule,
    LogEntriesModule,
    MembershipModule,
    NotificationsModule,
    OperatorsModule,
    ReviewsModule,
    TanksModule,
    UsersModule,
  ],

  providers: [AppService],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        helmet(),
        cookieParser(),
        useragent.express(),
        GeolocationMiddleware,
        LogRequestMiddleware,
      )
      .forRoutes({
        method: RequestMethod.ALL,
        path: '*',
      });
  }
}
