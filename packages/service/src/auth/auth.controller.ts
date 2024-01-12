import {
  Controller,
  Get,
  Post,
  Redirect,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUserDTO } from '@bottomtime/api';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './current-user';
import { User } from '../users/user';
import { Response } from 'express';
import { Config } from '../config';
import { GoogleAuthGuard } from './strategies/google.strategy';
import { GithubAuthGuard } from './strategies/github.strategy';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private async issueSessionCookie(user: User, res: Response): Promise<void> {
    const token = await this.authService.signJWT(`user|${user.id}`);
    res.cookie(Config.sessions.cookieName, token, {
      domain: Config.sessions.cookieDomain,
      maxAge: Config.sessions.cookieTTL,
      httpOnly: true,
    });
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
  async login(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    await this.issueSessionCookie(user, res);
    res.status(200).send(user.toJSON());
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
   *           Set-Cookie:
   *             description: |
   *               This header will be used to invalidate the application's session cookie in the user's browser.
   *             schema:
   *               type: string
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get('logout')
  @Redirect('/')
  logout(@Res() res: Response) {
    res.clearCookie(Config.sessions.cookieName);
  }

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
  @Get('google')
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
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Redirect('/')
  async loginWithGoogleCallback(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    await this.issueSessionCookie(user, res);
  }

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
  @Get('github')
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
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @Redirect('/')
  async loginWithGithubCallback(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    await this.issueSessionCookie(user, res);
  }
}
