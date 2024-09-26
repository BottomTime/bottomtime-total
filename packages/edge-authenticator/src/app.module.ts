import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { GoogleStrategy } from './google/google.strategy';
import { JwtService } from './jwt/jwt.service';
import { JwtStrategy } from './jwt/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({
      session: false,
    }),
  ],
  providers: [JwtService, JwtStrategy, GoogleStrategy],
  controllers: [AppController],
})
export class AppModule {}
