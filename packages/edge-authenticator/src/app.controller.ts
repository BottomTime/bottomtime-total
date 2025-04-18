import {
  Controller,
  Get,
  Inject,
  Logger,
  Render,
  Res,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { Config } from './config';
import { CurrentUser } from './current-user.decorator';
import { GoogleAuthGuard } from './google/google.guard';
import { Jwt } from './jwt/jwt.decorator';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { JwtService } from './jwt/jwt.service';
import { User } from './user';

type HomePageViewData = {
  user?: string;
  jwt?: string;
};

@Controller('/')
@UseGuards(JwtAuthGuard)
export class AppController {
  private readonly log = new Logger(AppController.name);

  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  @Get()
  @Render('index')
  async index(
    @CurrentUser() user: User | undefined,
    @Jwt() jwt: string | undefined,
  ): Promise<HomePageViewData> {
    this.log.debug(
      `Received request for home page from <${user?.email || 'anonymous'}>.`,
    );

    return {
      user: user?.email,
      jwt,
    };
  }

  @Get('login')
  @UseGuards(GoogleAuthGuard)
  login() {
    /* No-op. GoogleAuthGuard will redirect the user to Google to login. */
  }

  @Get('callback')
  @UseGuards(GoogleAuthGuard)
  callback(@CurrentUser() user: User, @Res() res: Response) {
    this.log.debug('Received callback from Google.');

    const jwt = this.jwtService.signJwt(user.email, user.authorizedDomains);

    this.log.debug(
      `Generated JWT for <${user.email}>. Issuing cookie: ${Config.cookie.name} for domain ${Config.cookie.domain}.`,
    );
    res.cookie(Config.cookie.name, jwt, {
      domain: Config.cookie.domain,
      httpOnly: true,
      maxAge: Config.cookie.ttl * 1000,
      secure: true,
    });

    res.redirect('/');
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.cookie(Config.cookie.name, '', {
      domain: Config.cookie.domain,
      httpOnly: true,
      maxAge: Config.cookie.ttl * 1000,
      secure: true,
    });
    res.redirect('/');
  }
}
