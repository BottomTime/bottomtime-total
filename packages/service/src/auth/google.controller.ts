import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { AuthService } from './auth.service';
import { CurrentAccount } from './current-account';
import { CurrentUser } from './current-user';
import { AssertAuth } from './guards/assert-auth.guard';
import { OAuthService } from './oauth.service';
import { GoogleAuthGuard, GoogleLinkGuard } from './strategies/google.strategy';
import { User } from './user';

@Controller('api/auth/google')
export class GoogleController {
  private readonly log = new Logger(GoogleController.name);

  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(OAuthService) private readonly oauth: OAuthService,
  ) {}

  /**
   * @openapi
   * /api/auth/google:
   *   get:
   *     summary: Log in with Google
   *     operationId: googleLogin
   *     description: |
   *       Redirects the user to Google to authenticate. If the authentication attempt is successful, the user will be redirected back to the application.
   *     tags:
   *       - Auth
   *     responses:
   *       302:
   *         description: The request succeeded and the user has been redirected to Google to authenticate.
   *         headers:
   *           Location:
   *             description: Redirects to Google to authenticate when the request completes.
   *             schema:
   *               type: string
   *               format: uri
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  @UseGuards(GoogleAuthGuard)
  loginWithGoogle() {
    /* Nothing to do here. The Passport module will handle the redirect to Google. */
  }

  /**
   * @openapi
   * /api/auth/google/callback:
   *   get:
   *     summary: Google OAuth2 callback
   *     operationId: googleLoginCallback
   *     description: |
   *       Handles the callback from Google after a user has authenticated. If the authentication attempt is successful, the user will be redirected back to the application.
   *
   *       **NOTE:** This endpoint is not intended to be called directly. It is called by Google after a user has authenticated.
   *     tags:
   *       - Auth
   *     responses:
   *       302:
   *         description: The request succeeded and the user has been redirected back to the application.
   *         headers:
   *           Location:
   *             description: Redirects back to the application when the request completes.
   *             schema:
   *               type: string
   *               format: uri
   *             example: https://localhost:3000/
   *           Set-Cookie:
   *             description: |
   *               Sets a session cookie in the user's browser to keep the user logged in.
   *               The cookie value will be a JWT that identifies the user to the backend service.
   *             schema:
   *               type: string
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get('callback')
  @UseGuards(GoogleAuthGuard)
  async loginWithGoogleCallback(
    @CurrentUser() user: User,
    @CurrentAccount() account: User | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (account) {
      this.log.log(
        `Linking Google account to user: @${account.username} (${account.id})`,
      );
      res.redirect('/account');
    } else {
      this.log.log(
        `User authenticated using Google: @${user.username} (${user.id})`,
      );
      await this.authService.issueSessionCookie(user, res);
      await user.updateLastLogin();
      res.redirect('/');
    }
  }

  @Get('authorize')
  @UseGuards(AssertAuth, GoogleLinkGuard)
  linkGoogleAccount() {
    /* No-op. Passport will handle this route as well. */
  }

  @Post('unauthorize')
  @UseGuards(AssertAuth)
  @HttpCode(204)
  async unlinkGoogleAccount(@CurrentUser() user: User): Promise<void> {
    await this.oauth.unlinkOAuthUser(user.id, 'google');
  }
}
