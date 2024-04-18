import {
  CreateUserOptionsSchema,
  CreateUserParamsDTO,
  SearchProfilesResponseDTO,
  SearchUserProfilesParamsDTO,
  SearchUserProfilesParamsSchema,
  UserRole,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Logger,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';
import { URL } from 'url';

import { AssertAuth, AuthService, CurrentUser } from '../auth';
import { Config } from '../config';
import { EmailService, EmailType } from '../email';
import { ZodValidator } from '../zod-validator';
import { User } from './user';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  private readonly log = new Logger(UsersController.name);

  constructor(
    @Inject(UsersService)
    private readonly users: UsersService,

    @Inject(AuthService)
    private readonly authService: AuthService,

    @Inject(EmailService)
    private readonly emailService: EmailService,
  ) {}

  /**
   * @openapi
   * /api/users:
   *   get:
   *     summary: Search User Profiles
   *     operationId: searchUsers
   *     description: |
   *       Searches for user profiles matching the search criteria.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *       - $ref: "#/components/parameters/UserQuerySearch"
   *       - name: filterFriends
   *         in: query
   *         description: |
   *           Indicates whether to filter out profiles that are already friends with the current user
   *           (or have pending friend requests open).
   *         type: boolean
   *         default: false
   *         example: true
   *       - $ref: "#/components/parameters/UserQuerySortBy"
   *       - $ref: "#/components/parameters/SortOrder"
   *       - $ref: "#/components/parameters/Skip"
   *       - $ref: "#/components/parameters/Limit"
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the list of user profiles matching the search criteria will be
   *           returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - users
   *                 - totalCount
   *               properties:
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: "#/components/schemas/Profile"
   *                 totalCount:
   *                   type: integer
   *                   minimum: 0
   *                   description: The total number of user profiles matching the search criteria.
   *                   example: 1
   *       "400":
   *         description: |
   *           The request failed because the query string parameters were invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user is not currently authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Get()
  @UseGuards(AssertAuth)
  async searchProfiles(
    @Query(new ZodValidator(SearchUserProfilesParamsSchema))
    params: SearchUserProfilesParamsDTO,
  ): Promise<SearchProfilesResponseDTO> {
    const result = await this.users.searchUsers(params);
    return {
      users: result.users.map((u) => u.profile.toJSON()),
      totalCount: result.totalCount,
    };
  }

  /**
   * @openapi
   * /api/users:
   *   post:
   *     summary: Create a New User
   *     operationId: createUser
   *     description: |
   *       Creates a new user account and signs in the new user.
   *     tags:
   *       - Users
   *     requestBody:
   *       description: The user account to create.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *             properties:
   *               username:
   *                 title: Username
   *                 type: string
   *                 pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
   *                 description: The user's username. May only contain letters, numbers, dashes, periods, and underscores. Must be unique per user.
   *                 example: johndoe
   *               email:
   *                 title: Email
   *                 type: string
   *                 format: email
   *                 description: The new user's email address. Must be unique per user.
   *                 example: johndoe@gmail.com
   *               password:
   *                 title: Password
   *                 type: string
   *                 format: password
   *                 description: The new user's password.
   *                 example: password
   *               role:
   *                 title: Role
   *                 type: string
   *                 enum:
   *                   - admin
   *                   - user
   *                 description: |
   *                   The new user's role. This can only be set by administrators. Regular users creating a
   *                   new account are not permitted to provide this property.
   *                 example: user
   *                 default: user
   *               profile:
   *                 $ref: "#/components/schemas/UpdateProfile"
   *               settings:
   *                 $ref: "#/components/schemas/UserSettings"
   *     responses:
   *       "201":
   *         description: |
   *           The new user account was created successfully and the account details will be in the response body.
   *           Additionally, if the user is not currently signed in, they will be signed in as the new user and the
   *           session cookie will be set.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user attempted to create a new admin account but is not currently signed in as an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "409":
   *         description: |
   *           The request failed because the username or email address is already in use. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  @Post()
  async createUser(
    @Res() res: Response,
    @CurrentUser() currentUser: User | undefined,
    @Body(new ZodValidator<CreateUserParamsDTO>(CreateUserOptionsSchema))
    options: CreateUserParamsDTO,
  ): Promise<void> {
    if (options.role && options.role !== UserRole.User) {
      if (!currentUser) {
        throw new UnauthorizedException(
          'You must be logged in to create an administrator account.',
        );
      }

      if (currentUser.role !== UserRole.Admin) {
        throw new ForbiddenException(
          'You are not authorized to create an administrator account.',
        );
      }
    }

    const user = await this.users.createUser(options);

    // Send a welcome email. (If an email address was provided.)
    if (user.email) {
      const verifyEmailToken = await user.requestEmailVerificationToken();
      const verificationUrl = new URL('/verifyEmail', Config.baseUrl);
      verificationUrl.searchParams.append('email', user.email);
      verificationUrl.searchParams.append('token', verifyEmailToken);
      const emailContent = await this.emailService.generateMessageContent({
        type: EmailType.Welcome,
        title: 'Welcome to Bottom Time',
        user,
        verifyEmailUrl: verificationUrl.toString(),
      });
      this.emailService.sendMail(
        { to: user.email },
        'Welcome to Bottom Time',
        emailContent,
      );
    }

    // If the user is not currently signed in, sign them in as the new user.
    // Exception: Don't do this for admins since they may just be provisioning new accounts for other users.
    if (!currentUser || currentUser.role !== UserRole.Admin) {
      await Promise.all([
        this.authService.issueSessionCookie(user, res),
        user.updateLastLogin(),
      ]);
    }

    res.status(201).send(user.toJSON());
  }
}
