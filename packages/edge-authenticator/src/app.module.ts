import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AppController } from './app.controller';
import { DependenciesModule } from './dependencies.module';
import { GoogleStrategy } from './google/google.strategy';
import { JwtService } from './jwt/jwt.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UserService } from './user.service';

@Module({
  imports: [
    PassportModule.register({
      session: false,
    }),
    DependenciesModule.forRoot(),
  ],
  providers: [UserService, JwtService, JwtStrategy, GoogleStrategy],
  controllers: [AppController],
})
export class AppModule {}
