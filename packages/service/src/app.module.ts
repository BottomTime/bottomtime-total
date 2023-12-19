import { DynamicModule, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Config } from './config';
import { UsersModule } from './users';
import { PassportModule } from '@nestjs/passport';
import { AdminModule } from './admin';
import { EmailModule, IMailClient } from './email';
import { FriendsModule } from './friends';

export type ServerDependencies = {
  mailClient: IMailClient;
};

@Module({})
export class AppModule {
  static forRoot(deps: ServerDependencies): DynamicModule {
    return {
      module: AppModule,
      imports: [
        MongooseModule.forRoot(Config.mongoUri),
        PassportModule.register({
          session: false,
        }),

        EmailModule.register(deps.mailClient),
        AdminModule,
        AuthModule,
        UsersModule,
        FriendsModule,
      ],
    };
  }
}
