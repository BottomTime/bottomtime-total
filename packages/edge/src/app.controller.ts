import { Controller, Get, Logger, Render, UseGuards } from '@nestjs/common';

import { CognitoAuthGuard } from './cognito/cognito.guard';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { User } from './user';

@Controller('/')
@UseGuards(JwtAuthGuard)
export class AppController {
  private readonly log = new Logger(AppController.name);

  @Get()
  @Render('index')
  async index(@CurrentUser() user: User | undefined) {
    this.log.debug(
      `Received request for home page from <${user?.email || 'anonymous'}>.`,
    );
    return { user: user?.email };
  }

  @Get('login')
  @UseGuards(CognitoAuthGuard)
  login() {}

  @Get('callback')
  @UseGuards(CognitoAuthGuard)
  callback() {}
}
