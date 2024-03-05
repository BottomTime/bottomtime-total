import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../data';
import { UserModelName, UserSchema } from '../schemas';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AnonymousStrategy } from './strategies/anon.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserModelName, schema: UserSchema }]),
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, AnonymousStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, AnonymousStrategy],
})
export class AuthModule {}
