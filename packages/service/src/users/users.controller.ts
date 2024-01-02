import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Head,
  HttpCode,
  Logger,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ChangeEmailParams,
  ChangeEmailParamsSchema,
  ChangeUsernameParams,
  ChangeUsernameParamsSchema,
  CreateUserOptions,
  CreateUserOptionsSchema,
  ProfileDTO,
  ProfileVisibility,
  SearchUsersParams,
  SearchUsersParamsSchema,
  UserDTO,
  UserRole,
} from '@bottomtime/api';
import { ZodValidator } from '../zod-validator';
import { AssertAuth, CurrentUser } from '../auth';
import { User } from './user';
import { TargetUser } from './users.decorators';
import { AssertTargetUser } from './assert-target-user.guard';

const UsernameParam = 'username';
@Controller('api/users')
export class UsersController {
  private readonly log = new Logger(UsersController.name);

  constructor(private readonly users: UsersService) {}

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
   *       - name: query
   *         description: The query text to search for in the user profiles.
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           maxLength: 200
   *       - name: sortBy
   *         description: The field to sort by.
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum:
   *             - username
   *             - memberSince
   *       - name: sortOrder
   *         description: The sort order.
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum:
   *             - asc
   *             - desc
   *       - name: skip
   *         description: The number of results to skip.
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *       - name: limit
   *         description: The maximum number of results to return.
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 200
   *           default: 100
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
   *                 - profiles
   *                 - totalCount
   *               properties:
   *                 profiles:
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
   *           The request failed because the user was not authenticated.
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
  async searchProfiles(
    @CurrentUser() user: User | undefined,
    @Query(new ZodValidator(SearchUsersParamsSchema))
    params: SearchUsersParams,
  ): Promise<ProfileDTO[]> {
    let profileVisibleTo: string | undefined;

    if (user) {
      if (user.role !== 'admin') {
        profileVisibleTo = user.username;
      }
    } else {
      profileVisibleTo = '#public';
    }

    const users = await this.users.searchUsers({
      ...params,
      profileVisibleTo,
    });
    return users.map((u) => u.profile.toJSON());
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
   *                 $ref: "#/components/schemas/UpdateProfileParams"
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
  @HttpCode(201)
  async createUser(
    @Body(new ZodValidator<CreateUserOptions>(CreateUserOptionsSchema))
    options: CreateUserOptions,
  ): Promise<UserDTO> {
    const user = await this.users.createUser(options);
    return user.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}:
   *   head:
   *     summary: Check if a Username or Email Address is Available
   *     operationId: isUsernameOrEmailAvailable
   *     description: |
   *       Checks if a username or email address is available. This is useful for checking if a user is attempting to create a new account with a username or email address that is already in use.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: |
   *           The username or email address was found and is already in use.
   *       "404":
   *         description: |
   *           The username or email cannot be found (i.e. it is available).
   *       "500":
   *         description: |
   *           The request failed because of an internal server error.
   */
  @Head(`:${UsernameParam}`)
  @UseGuards(AssertTargetUser)
  async isUsernameOrEmailAvailable(): Promise<void> {
    // This method is effectively a no-op. If the guard hasn't thrown a NotFoundException, then we can just return a
    // success status code.
  }

  /**
   * @openapi
   * /api/users/{username}:
   *   get:
   *     summary: Get a User Profile
   *     operationId: getUserProfile
   *     description: |
   *       Gets a user profile by username or email address.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       "200":
   *         description: |
   *           The request succeeded and the user profile will be returned in the response body.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Profile"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to view the profile.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
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
  @Get(`:${UsernameParam}`)
  @UseGuards(AssertTargetUser)
  async getUserProfile(
    @CurrentUser() currentUser: User | undefined,
    @TargetUser() user: User,
  ): Promise<ProfileDTO> {
    // Anonymous users MAY ONLY see profiles with public visibility.
    if (!currentUser) {
      if (user.settings.profileVisibility !== ProfileVisibility.Public) {
        throw new UnauthorizedException(
          'You must be logged in to view this profile',
        );
      }
    } else if (currentUser.role === UserRole.User) {
      // Regular users MAY NOT see profiles with private visibility.
      if (user.settings.profileVisibility === ProfileVisibility.Private) {
        throw new ForbiddenException(
          'You are not authorized to view this profile.',
        );
      }

      // TODO: Regular users MAY NOT see profiles with friends-only visibility if they are not friends with the profile owner.
      if (user.settings.profileVisibility === ProfileVisibility.FriendsOnly) {
        throw new ForbiddenException(
          'You are not authorized to view this profile.',
        );
      }
    }

    // Administrators MAY see all profiles.

    return user.profile.toJSON();
  }

  /**
   * @openapi
   * /api/users/{username}/changeUsername:
   *   post:
   *     summary: Change a User's Username
   *     operationId: changeUsername
   *     description: |
   *       Changes a user's username.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new username.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newUsername
   *             properties:
   *               newUsername:
   *                 title: New Username
   *                 type: string
   *                 pattern: ^[a-z0-9]+([_.-][a-z0-9]+)*$
   *                 description: The user's new username. May only contain letters, numbers, dashes, periods, and underscores. Must be unique per user.
   *                 example: janedoe
   *     responses:
   *       "204":
   *         description: |
   *           The username was changed successfully.
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to change the username.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "409":
   *         description: |
   *           The request failed because the new username is already in use. See the error details for more information.
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
  @Post(`:${UsernameParam}/changeUsername`)
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertTargetUser)
  async changeUsername(
    @CurrentUser() currentUser: User,
    @TargetUser() targetUser: User,
    @Body(new ZodValidator(ChangeUsernameParamsSchema))
    { newUsername }: ChangeUsernameParams,
  ): Promise<void> {}

  /**
   * @openapi
   * /api/users/{username}/changeEmail:
   *   post:
   *     summary: Change a User's Email Address
   *     operationId: changeEmail
   *     description: |
   *       Changes a user's email address.
   *     tags:
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new email address.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newEmail
   *             properties:
   *               newEmail:
   *                 title: New Email
   *                 type: string
   *                 format: email
   *                 description: The user's new email address. Must be unique per user.
   *                 example: new_email@bottomti.me
   *     responses:
   *       "204":
   *         description: |
   *           The email address was changed successfully.
   *       "400":
   *         description: |
   *           The request failed because the request body was invalid. See the error details for more information.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "401":
   *         description: |
   *           The request failed because the user was not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "403":
   *         description: |
   *           The request failed because the user is not authorized to change the email address.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: |
   *           The request failed because the username or email address could not be found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "409":
   *         description: |
   *           The request failed because the new email address is already in use. See the error details for more information.
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
  @Post(`:${UsernameParam}/changeEmail`)
  @HttpCode(204)
  @UseGuards(AssertAuth, AssertTargetUser)
  async changeEmail(
    @CurrentUser() currentUser: User,
    @TargetUser() targetUser: User,
    @Body(new ZodValidator(ChangeEmailParamsSchema))
    { newEmail }: ChangeEmailParams,
  ): Promise<void> {}
}
