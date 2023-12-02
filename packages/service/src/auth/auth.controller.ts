import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUserDTO, UserDTO } from '@bottomtime/api';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './current-user';
import { User } from '../users/user';
import { Response } from 'express';
import { Config } from '../config';
import { GoogleAuthGuard } from './strategies/google.strategy';
import { GithubAuthGuard } from './strategies/github.strategy';
import { ApiInternalServerErrorResponse, ApiTags } from '@nestjs/swagger';

@Controller('api/auth')
@ApiTags('Auth')
@ApiInternalServerErrorResponse({
  description: 'An internal server error has occurred',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private async issueSessionCookie(user: User, res: Response): Promise<void> {
    const token = await this.authService.signJWT(`user|${user.id}`);
    res.cookie(Config.sessions.cookieName, token, {
      domain: Config.sessions.cookieDomain,
      maxAge: Config.sessions.cookieTTL,
      httpOnly: true,
    });
    res.status(200).json(user.toJSON());
  }

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
  async login(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    await this.issueSessionCookie(user, res);
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie(Config.sessions.cookieName);
    res.status(200).redirect('/');
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  loginWithGoogle() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  loginWithGoogleCallback() {}

  @Get('github')
  @UseGuards(GithubAuthGuard)
  loginWithGithub() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  loginWithGithubCallback() {}
}
