import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';
import { User } from '../user';

@Injectable()
export class LocalStrategyGuard extends AuthGuard('local') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private readonly log: Logger = new Logger(LocalStrategy.name);

  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    super({ usernameField: 'usernameOrEmail' });
  }

  async validate(usernameOrEmail: string, password: string): Promise<User> {
    this.log.debug(
      `Attempting to login user "${usernameOrEmail}" using password authentication...`,
    );
    const user = await this.authService.authenticateUser(
      usernameOrEmail,
      password,
    );

    if (!user) {
      this.log.warn(
        `Login failed for user "${usernameOrEmail}". Password was incorrect or account was invalid.`,
      );
      throw new UnauthorizedException(
        'Login failed. Username or password were incorrect',
      );
    }

    this.log.log(
      `Successfully logged in user "${usernameOrEmail}" using password.`,
    );
    return user;
  }
}
