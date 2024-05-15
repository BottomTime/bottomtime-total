import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity, UserOAuthEntity } from '../data';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { AnonymousStrategy } from './strategies/anon.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserOAuthEntity]),
    PassportModule,
  ],
  providers: [
    AuthService,
    OAuthService,
    LocalStrategy,
    JwtStrategy,
    AnonymousStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, OAuthService, JwtStrategy, AnonymousStrategy],
})
export class AuthModule {}
