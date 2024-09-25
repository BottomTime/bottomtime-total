import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { AuthService } from './auth.service';
import { CognitoStrategy } from './cognito/cognito.strategy';
import { JwtStrategy } from './jwt/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({
      session: false,
    }),
  ],
  providers: [AuthService, JwtStrategy, CognitoStrategy],
  controllers: [AppController],
})
export class AppModule {}
