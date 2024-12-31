import {
  CurrentUserDTO,
  PurgeJwtInvalidationsRequestDTO,
  PurgeJwtInvalidationsRequestSchema,
  PurgeJwtInvalidationsResultDTO,
  SuccessFailResponseDTO,
  UserRole,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Request, Response } from 'express';

import { AssertAdmin, User } from '../users';
import { CurrentUser } from '../users/current-user';
import { AssertAuth } from '../users/guards/assert-auth.guard';
import { ZodValidator } from '../zod-validator';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';

const UrlPathRegex = /^\/(?!.*\/\/)([a-zA-Z0-9-_/]+)$/gim;

@Controller('api/auth')
export class AuthController {
  private readonly log = new Logger(AuthController.name);

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
   * /api/auth/oauth/{username}/{provider}:
   *   delete:
   *     summary: Unlink an OAuth provider from a user's account
   *     description: |
   *       Unlink's a user's account from the indicated OAuth provider. This will prevent the user from logging in using the OAuth provider in the future.
   *     operationId: unlinkOAuthProvider
   *     tags:
   *       - Auth
   *       - Users
   *     parameters:
   *       - in: path
   *         name: username
   *         description: The username of the user to unlink the OAuth provider from.
   *         required: true
   *         schema:
   *           type: string
   *           example: johndoe
   *       - in: path
   *         name: provider
   *         description: The name of the OAuth provider to unlink from the user.
   *         required: true
   *         schema:
   *           type: string
   *           example: google
   *     responses:
   *       204:
   *         description: The request succeeded and the OAuth provider has been unlinked from the user.
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the current user is not authorized to unlink the OAuth provider from the specified user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the specified user account does not exist or the user does not have a connection to the specified OAuth provider.
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
  @Delete('oauth/:username/:provider')
  @UseGuards(AssertAuth)
  @HttpCode(204)
  async unlinkOAuthProvider(
    @CurrentUser() currentUser: User,
    @Param('username') targetUser: string,
    @Param('provider') provider: string,
  ): Promise<void> {
    targetUser = targetUser.trim();
    if (
      currentUser.role !== UserRole.Admin &&
      currentUser.username.toLowerCase() !== targetUser.toLowerCase()
    ) {
      throw new ForbiddenException(
        'You are not authorized to view the OAuth connections for the specified user.',
      );
    }

    const result = await this.oauth.unlinkOAuthUser(targetUser, provider);

    if (!result) {
      throw new NotFoundException(
        `Cannot find account for user "${targetUser}" or the user does not have a connection to provider "${provider}".`,
      );
    }
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
    res.status(HttpStatus.OK).send(user.toJSON());
  }

  /**
   * @openapi
   * /api/auth/logout:
   *   get:
   *     summary: Log out and return to homepage
   *     operationId: logoutWithRedirect
   *     description: |
   *       Logs out the current user. This will invalidate the user's session cookie and redirect them back to the home page.
   *     parameters:
   *       - in: query
   *         name: redirectTo
   *         description: |
   *           The path to redirect the user to after logging out. It cannot be a full URL. Only paths on the current domain
   *           will be accepted for security reasons. If an invalid path is provided, the user will be redirected to the home
   *           page (`/`).
   *         schema:
   *           type: string
   *           example: /logbook
   *           default: /
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
  async logoutWithRedirect(
    @Req() req: Request,
    @Res() res: Response,
    @Query('redirectTo') redirectTo: string | undefined,
  ): Promise<void> {
    redirectTo ||= '/';
    if (!UrlPathRegex.test(redirectTo)) redirectTo = '/';

    this.log.debug(`Logging out and redirecting to: ${redirectTo}`);

    await this.authService.revokeSession(req, res);
    res.redirect(redirectTo);
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
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const response: SuccessFailResponseDTO = { succeeded: true };
    await this.authService.revokeSession(req, res);
    res.json(response);
  }

  /**
   * @openapi
   * /api/auth/invalidations:
   *   delete:
   *     summary: Purge expired JWT invalidations
   *     operationId: purgeExpiredInvalidations
   *     description: |
   *       Purges all expired JWT invalidations from the database from before the specified date.
   *     tags:
   *       - Auth
   *       - Admin
   *     requestBody:
   *       description: The date before which invalidations should be purged.
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - invalidatedBefore
   *             properties:
   *               invalidatedBefore:
   *                 title: Invalidated Before
   *                 type: string
   *                 format: date-time
   *                 description: |
   *                   The date before which invalidations should be purged. All invalidations with timestamps before this date will be
   *                   removed. This date must be in the past or the request will fail.
   *                 example: 2021-01-01T00:00:00Z
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains the number of invalidations purged.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - purged
   *               properties:
   *                 purged:
   *                   title: Purged Entries
   *                   type: integer
   *                   description: The number of invalidations that were purged from the database by this operation.
   *                   example: 14
   *       400:
   *         description: |
   *           The request failed because the request body was invalid or missing, or because the `invalidatedBefore` parameter
   *           was not in the past.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the current user is not authorized to purge invalidations.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the current user is not an administrator.
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
  @Delete('invalidations')
  @UseGuards(AssertAdmin)
  async purgeExpiredInvalidations(
    @Body(new ZodValidator(PurgeJwtInvalidationsRequestSchema))
    { invalidatedBefore }: PurgeJwtInvalidationsRequestDTO,
  ): Promise<PurgeJwtInvalidationsResultDTO> {
    const purged = await this.authService.purgeExpiredInvalidations(
      new Date(invalidatedBefore),
    );
    return { purged };
  }
}
