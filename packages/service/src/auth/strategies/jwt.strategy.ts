import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Config } from '../../config';
import { ExtractJwt } from 'passport-jwt';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../../users/user';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtOrAnonAuthGuard extends AuthGuard(['jwt', 'anon']) {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly log = new Logger(JwtStrategy.name);

  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    const jwtFromRequest = ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      (req) => {
        if (req.cookies) return req.cookies[Config.sessions.cookieName];
        else return undefined;
      },
    ]);

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      // issuer: Config.baseUrl,
      secretOrKey: Config.sessions.sessionSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return await this.authService.validateJwt(payload);
  }
}
