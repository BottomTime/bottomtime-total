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

  /**
   * @openapi
   * /api/auth/me:
   *   get:
   *     summary: Get the current user
   *     operationId: currentUser
   *     tags:
   *       - Auth
   *       - Users
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains the current user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/CurrentUser"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get('me')
  currentUser(@CurrentUser() user: User | undefined): CurrentUserDTO {
    return user
      ? {
          anonymous: false,
          ...user.toJSON(),
        }
      : { anonymous: true };
  }

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     summary: Log in
   *     operationId: login
   *     description: |
   *       Attempts to login a user using their username and password. If the login attempt is successful, the response body will contain the current user.
   *       Additionally, a session cookie will be issued to keep the user's login session alive in a browser.
   *     tags:
   *       - Auth
   *     requestBody:
   *       description: The user's credentials.
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - usernameOrEmail
   *               - password
   *             properties:
   *               usernameOrEmail:
   *                 title: Username
   *                 type: string
   *                 description: The user's username (or email address).
   *                 example: johndoe
   *               password:
   *                 title: Password
   *                 type: string
   *                 format: password
   *                 description: The user's password.
   *                 example: '!pAssw0rd__123@@'
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains the current user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *         headers:
   *           Set-Cookie:
   *             description: |
   *               Sets a session cookie in the user's browser to keep the user logged in.
   *               The cookie value will be a JWT that identifies the user to the backend service.
   *             schema:
   *               type: string
   *       400:
   *         description: The request failed because the request body was invalid or missing.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The login attempt failed. The user should check that they entered the correct credentials.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<UserDTO> {
    await this.issueSessionCookie(user, res);
    return user.toJSON();
  }

  /**
   * @openapi
   * /api/auth/logout:
   *   get:
   *     summary: Log out
   *     operationId: logout
   *     description: |
   *       Logs out the current user. This will invalidate the user's session cookie and redirect them back to the home page.
   *     tags:
   *       - Auth
   *     responses:
   *       302:
   *         description: The request succeeded and the user has been logged out. The user will be redirected to the home page.
   *         headers:
   *           Location:
   *             description: Redirects to the homepage when the request completes.
   *             schema:
   *               type: string
   *               format: uri
   *               example: /
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie(Config.sessions.cookieName);
    res.redirect('/');
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
