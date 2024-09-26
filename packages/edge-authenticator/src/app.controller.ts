import {
  Controller,
  Get,
  Inject,
  Logger,
  Redirect,
  Render,
  Res,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { Config } from './config';
import { CurrentUser } from './current-user.decorator';
import { GoogleAuthGuard } from './google/google.guard';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { JwtService } from './jwt/jwt.service';
import { User } from './user';

@Controller('/')
@UseGuards(JwtAuthGuard)
export class AppController {
  private readonly log = new Logger(AppController.name);

  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  @Get()
  @Render('index')
  async index(@CurrentUser() user: User | undefined) {
    this.log.debug(
      `Received request for home page from <${user?.email || 'anonymous'}>.`,
    );
    return { user: user?.email, domain: Config.protectedDomain };
  }

  @Get('login')
  @UseGuards(GoogleAuthGuard)
  login() {
    /* Nothing to do here. Passport will redirect to AWS Cognito client. */
    this.log.debug('Redirecting to Google for authentication.');
  }

  @Get('callback')
  @UseGuards(GoogleAuthGuard)
  @Render('authorized')
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
    });

    return { user: user.email, domain: Config.protectedDomain };
  }

  @Get('logout')
  @Redirect('/')
  logout(@Res() res: Response) {
    res.clearCookie(Config.cookie.name);
  }
}
