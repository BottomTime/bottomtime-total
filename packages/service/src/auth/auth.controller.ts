import {
  CurrentUserDTO,
  SuccessFailResponseDTO,
  UserRole,
} from '@bottomtime/api';

import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Response } from 'express';

import { Config } from '../config';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user';
import { AssertAuth } from './guards/assert-auth.guard';
import { OAuthService } from './oauth.service';
import { User } from './user';

@Controller('api/auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(OAuthService) private readonly oauth: OAuthService,
  ) {}

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
   * /api/auth/oauth/{username}:
   *   get:
   *     summary: Get OAuth connections for a user
   *     operationId: getOAuthConnectionsForUser
   *     tags:
   *       - Auth
   *       - Users
   *     parameters:
   *       - in: path
   *         name: username
   *         description: The username of the user to get OAuth connections for.
   *         required: true
   *         schema:
   *           type: string
   *           example: johndoe
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains an array of OAuth providers to which the user has linked their account.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: string
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the current user is not authorized to view the OAuth connections for the specified user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the specified user account does not exist.
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
  @Get('oauth/:username')
  @UseGuards(AssertAuth)
  async getOAuthConnectionsForUser(
    @CurrentUser() currentUser: User,
    @Param('username') targetUser: string,
  ): Promise<string[]> {
    targetUser = targetUser.trim();
    if (
      currentUser.role !== UserRole.Admin &&
      currentUser.username.toLowerCase() !== targetUser.toLowerCase()
    ) {
      throw new ForbiddenException(
        'You are not authorized to view the OAuth connections for the specified user.',
      );
    }

    const userExists = await this.oauth.isUsernameTaken(targetUser);
    if (!userExists) {
      throw new NotFoundException(
        `Cannot find account for user "${targetUser}".`,
      );
    }

    const connections = await this.oauth.listLinkedOAuthAccounts(targetUser);
    return connections.map((connection) => connection.provider);
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
    await Promise.all([
      this.authService.issueSessionCookie(user, res),
      user.updateLastLogin(),
    ]);
    res.status(200).send(user.toJSON());
  }

  /**
   * @openapi
   * /api/auth/logout:
   *   get:
   *     summary: Log out and return to homepage
   *     operationId: logoutWithRedirect
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
  logoutWithRedirect(@Res() res: Response) {
    res.clearCookie(Config.sessions.cookieName);
    res.redirect('/');
  }

  /**
   * @openapi
   * /api/auth/logout:
   *   post:
   *     summary: Log out
   *     operationId: logout
   *     description: |
   *       Logs out the current user. This will invalidate the user's session cookie.
   *     tags:
   *       - Auth
   *     responses:
   *       200:
   *         $ref: "#/components/responses/SuccessResponse"
   *       500:
   *         description: The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post('logout')
  logout(@Res() res: Response) {
    const response: SuccessFailResponseDTO = { succeeded: true };
    res.clearCookie(Config.sessions.cookieName);
    res.json(response);
  }
}
