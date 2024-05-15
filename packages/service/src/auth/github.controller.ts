import {
  Controller,
  Get,
  Inject,
  Redirect,
  Res,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { User } from '../users';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user';
import { GithubAuthGuard } from './strategies/github.strategy';

@Controller('api/auth/github')
export class GithubController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * @openapi
   * /api/auth/github:
   *   get:
   *     summary: Log in with GitHub
   *     operationId: githubLogin
   *     description: |
   *       Redirects the user to GitHub to authenticate. If the authentication attempt is successful, the user will be redirected back to the application.
   *     tags:
   *       - Auth
   *     responses:
   *       302:
   *         description: The request succeeded and the user has been redirected to GitHub to authenticate.
   *         headers:
   *           Location:
   *             description: Redirects to GitHub to authenticate when the request completes.
   *             schema:
   *               type: string
   *               format: uri
   */
  @Get()
  @UseGuards(GithubAuthGuard)
  loginWithGithub() {
    /* Nothing to do here. The Passport module will handle the redirect to GitHub. */
  }

  /**
   * @openapi
   * /api/auth/github/callback:
   *   get:
   *     summary: Github OAuth2 callback
   *     operationId: githubLoginCallback
   *     description: |
   *       Handles the callback from GitHub after a user has authenticated. If the authentication attempt is successful, the user will be redirected back to the application.
   *
   *       **NOTE:** This endpoint is not intended to be called directly. It is called by GitHub after a user has authenticated.
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
  @UseGuards(GithubAuthGuard)
  @Redirect('/')
  async loginWithGithubCallback(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.issueSessionCookie(user, res);
    await user.updateLastLogin();
  }
}
