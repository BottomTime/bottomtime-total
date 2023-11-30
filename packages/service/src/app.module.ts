import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Config } from './config';
import { UsersModule } from './users';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    MongooseModule.forRoot(Config.mongoUri),
    PassportModule.register({
      session: false,
    }),
    UsersModule,
    AuthModule,
  ],
  providers: [],
  controllers: [],
  exports: [],
})
export class AppModule {}
