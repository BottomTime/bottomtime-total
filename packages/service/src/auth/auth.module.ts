import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserOAuthEntity } from '../data';
import { UsersModule } from '../users';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DiscordController } from './discord.controller';
import { GithubController } from './github.controller';
import { GoogleController } from './google.controller';
import { OAuthService } from './oauth.service';
import { DiscordStrategy } from './strategies/discord.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOAuthEntity]),
    PassportModule,
    UsersModule,
  ],
  providers: [
    AuthService,
    OAuthService,
    LocalStrategy,
    JwtStrategy,

    // OAuth
    DiscordStrategy,
    GithubStrategy,
    GoogleStrategy,
  ],
  controllers: [
    AuthController,

    // OAuth
    DiscordController,
    GoogleController,
    GithubController,
  ],
  exports: [AuthService],
})
export class AuthModule {}
