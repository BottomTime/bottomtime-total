import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamicModule, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IConfigCatClient } from 'configcat-node';
import Stripe from 'stripe';
import { DataSource, DataSourceOptions } from 'typeorm';

import { AdminModule } from './admin';
import { AlertsModule } from './alerts';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { Queues } from './common';
import { Config } from './config';
import { DiveSiteEntity, LogEntryEntity, UserEntity } from './data';
import { DiveSitesModule } from './diveSites/dive-sites.module';
import { FeaturesModule } from './features';
import { FriendsModule } from './friends';
import { LogEntriesModule } from './logEntries';
import { MembershipModule } from './membership';
import { DiveOperatorsModule } from './operators';
import { QueueModule } from './queue';
import { StorageModule } from './storage';
import { TanksModule } from './tanks/tanks.module';
import { UsersModule } from './users';

export type ServerDependencies = {
  configCatClient: IConfigCatClient;
  dataSource: DataSourceOptions;
  s3Client: S3Client;
  sqsClient: SQSClient;
  stripe: Stripe;
};

@Module({})
export class AppModule {
  static forRoot(deps: ServerDependencies): DynamicModule {
    return {
      module: AppModule,
      imports: [
        EventEmitterModule.forRoot(),
        TypeOrmModule.forRootAsync({
          useFactory: () => deps.dataSource,
          dataSourceFactory: async (options?: DataSourceOptions) => {
            const ds = new DataSource(options ?? deps.dataSource);
            return await ds.initialize();
          },
        }),
        PassportModule.register({
          session: false,
        }),
        StorageModule.forRoot(deps.s3Client),
        QueueModule.forRoot(deps.sqsClient, {
          key: Queues.email,
          queueUrl: Config.aws.sqs.emailQueueUrl,
        }),

        TypeOrmModule.forFeature([UserEntity, DiveSiteEntity, LogEntryEntity]),
        FeaturesModule.forRoot(deps.configCatClient),
        MembershipModule.forRoot(deps.stripe),

        UsersModule,
        AuthModule,

        AlertsModule,
        AdminModule,
        FriendsModule,
        DiveSitesModule,
        DiveOperatorsModule,
        LogEntriesModule,
        TanksModule,
      ],

      providers: [AppService],
      controllers: [AppController],
    };
  }
}
