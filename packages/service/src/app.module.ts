import { S3Client } from '@aws-sdk/client-s3';
import { DynamicModule, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';

import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

import { AdminModule } from './admin';
import { AuthModule } from './auth/auth.module';
import { DiveSitesModule } from './diveSites/dive-sites.module';
import { EmailModule, IMailClient } from './email';
import { FriendsModule } from './friends';
import { HealthModule } from './health';
import { StorageModule } from './storage';
import { TanksModule } from './tanks/tanks.module';
import { UsersModule } from './users';

export type ServerDependencies = {
  dataSource: DataSourceOptions;
  mailClient: IMailClient;
  s3Client: S3Client;
};

@Module({})
export class AppModule {
  static forRoot(deps: ServerDependencies): DynamicModule {
    return {
      module: AppModule,
      imports: [
        EventEmitterModule.forRoot(),
        // Serve statically-generated API documentation.
        ServeStaticModule.forRoot({
          rootPath: path.join(__dirname, '../public/docs'),
          serveRoot: '/docs',
          serveStaticOptions: {
            index: 'index.html',
          },
        }),
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
        EmailModule.forRoot(deps.mailClient),
        StorageModule.forRoot(deps.s3Client),
        HealthModule,

        AdminModule,
        AuthModule,
        UsersModule,
        FriendsModule,
        DiveSitesModule,
        TanksModule,
      ],
    };
  }
}
