import { S3Client } from '@aws-sdk/client-s3';
import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';

import path from 'path';
import { DataSource } from 'typeorm';

import { AdminModule } from './admin';
import { AuthModule } from './auth/auth.module';
import { Config } from './config';
import { DiveSitesModule } from './diveSites/dive-sites.module';
import { EmailModule, IMailClient } from './email';
import { FriendsModule } from './friends';
import { HealthModule } from './health';
import { StorageModule } from './storage';
import { TanksModule } from './tanks/tanks.module';
import { UsersModule } from './users';

export type ServerDependencies = {
  dataSource: DataSource;
  mailClient: IMailClient;
  s3Client: S3Client;
};

@Module({})
export class AppModule {
  static forRoot(deps: ServerDependencies): DynamicModule {
    return {
      module: AppModule,
      imports: [
        // Serve statically-generated API documentation.
        // TODO: This should be moved somewhere else. The backend should not be serving this content.
        ServeStaticModule.forRoot({
          rootPath: path.join(__dirname, '../public/docs'),
          serveRoot: '/docs',
          serveStaticOptions: {
            index: 'index.html',
          },
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: Config.postgresUri,
          entities: [path.join(__dirname, './data/**/*.entity.ts')],
        }),
        MongooseModule.forRoot(Config.mongoUri),
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
