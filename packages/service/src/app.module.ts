import { DynamicModule, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Config } from './config';
import { UsersModule } from './users';
import { PassportModule } from '@nestjs/passport';
import { AdminModule } from './admin';
import { EmailModule, IMailClient } from './email';
import { FriendsModule } from './friends';
import { TanksModule } from './tanks/tanks.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'path';
import { DiveSitesModule } from './diveSites/dive-sites.module';
import { HealthModule } from './health';

export type ServerDependencies = {
  mailClient: IMailClient;
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
        MongooseModule.forRoot(Config.mongoUri),
        PassportModule.register({
          session: false,
        }),
        EmailModule.forRoot(deps.mailClient),
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
