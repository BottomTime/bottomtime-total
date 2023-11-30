import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from '../schemas';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AnonymousStrategy } from './strategies/anon.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema }]),
    PassportModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, AnonymousStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, AnonymousStrategy],
})
export class AuthModule {}
