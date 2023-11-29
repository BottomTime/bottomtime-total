import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Config } from './config';
import { UsersModule } from './users';

@Module({
  imports: [MongooseModule.forRoot(Config.mongoUri), UsersModule, AuthModule],
  providers: [],
  controllers: [],
  exports: [],
})
export class AppModule {}
