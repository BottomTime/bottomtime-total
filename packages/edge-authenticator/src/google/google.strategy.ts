import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Profile, Strategy, StrategyOptions } from 'passport-google-oauth20';

import { Config } from '../config';
import { User } from '../user';
import { UserService } from '../user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly log = new Logger(GoogleStrategy.name);

  constructor(@Inject(UserService) private readonly users: UserService) {
    const options: StrategyOptions = {
      callbackURL: new URL('/callback', Config.baseUrl).toString(),
      clientID: Config.google.clientId,
      clientSecret: Config.google.clientSecret,
      passReqToCallback: false,
      scope: 'email',
    };
    super(options);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    this.log.debug('Received response from Google.');

    const email = profile.emails?.[0].value;
    if (!email) {
      throw new UnauthorizedException('No email address provided by Google');
    }

    const user = await this.users.findUser(email);
    if (!user) {
      throw new UnauthorizedException(`User is not authorized: <${email}>`);
    }

    this.log.log(`Authenticated user <${email}>.`);
    return user;
  }
}
