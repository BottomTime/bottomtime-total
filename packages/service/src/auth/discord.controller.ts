import { Controller, Get, Inject, Res, UseGuards } from '@nestjs/common';

import { Response } from 'express';

import { AuthService } from './auth.service';
import { CurrentUser } from './current-user';
import { DiscordAuthGuard } from './strategies/discord.strategy';
import { User } from './user';

@Controller('api/auth/discord')
export class DiscordController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * @openapi
   * /api/auth/discord:
   *   get:
   *     summary: Log in with Discord
   *     operationId: discordLogin
   *     description: |
   *       Redirects the user to Discord to authenticate. If the authentication attempt is successful, the user will be redirected back to the application.
   *     tags:
   *       - Auth
   *     responses:
   *       302:
   *         description: The request succeeded and the user has been redirected to Discord to authenticate.
   *         headers:
   *           Location:
   *             description: Redirects to Discord to authenticate when the request completes.
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
  @UseGuards(DiscordAuthGuard)
  loginWithDiscord() {
    /* Nothing to do here. The Passport module will handle the redirect to Discord. */
  }

  /**
   * @openapi
   * /api/auth/discord/callback:
   *   get:
   *     summary: Discord OAuth2 callback
   *     operationId: discordLoginCallback
   *     description: |
   *       Handles the callback from Discord after a user has authenticated. If the authentication attempt is successful, the user will be redirected back to the application.
   *
   *       **NOTE:** This endpoint is not intended to be called directly. It is called by Discord after a user has authenticated.
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
  @UseGuards(DiscordAuthGuard)
  async loginWithDiscordCallback(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.issueSessionCookie(user, res);
    await user.updateLastLogin();
    res.redirect('/');
  }
}
