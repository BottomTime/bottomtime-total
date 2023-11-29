import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUserDTO, UserDTO } from '@bottomtime/api';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './current-user';
import { User } from '../users/user';
import { Response } from 'express';
import { Config } from '../config';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  currentUser(@CurrentUser() user: User | undefined): CurrentUserDTO {
    return user
      ? {
          anonymous: false,
          ...user.toJSON(),
        }
      : { anonymous: true };
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<UserDTO> {
    const token = await this.authService.signJWT(user.id);
    res.cookie(Config.sessions.cookieName, token);
    return user.toJSON();
  }
}
