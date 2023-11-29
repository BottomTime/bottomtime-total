import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { User } from '../../users/user';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'usernameOrEmail' });
  }

  async validate(usernameOrEmail: string, password: string): Promise<User> {
    const user = await this.authService.authenticateUser(
      usernameOrEmail,
      password,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Login failed. Username or password were incorrect',
      );
    }

    return user;
  }
}
