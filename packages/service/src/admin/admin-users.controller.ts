import {
  AdminSearchUsersParamsDTO,
  AdminSearchUsersParamsSchema,
  ApiList,
  ChangeMembershipParams,
  ChangeMembershipParamsSchema,
  ChangeRoleParams,
  ChangeRoleParamsSchema,
  ResetPasswordParams,
  ResetPasswordParamsSchema,
  UserDTO,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AssertAdmin } from '../users';
import { UsersService } from '../users/users.service';
import { ZodValidator } from '../zod-validator';
import { AdminService } from './admin.service';

const UsernameParam = 'username';

@Controller('api/admin/users')
@UseGuards(AssertAdmin)
export class AdminUsersController {
  private readonly log = new Logger(AdminUsersController.name);

  constructor(
    @Inject(AdminService)
    private readonly adminService: AdminService,

    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  /**
   * @openapi
   * /api/admin/users:
   *   get:
   *     summary: Search users
   *     operationId: searchUsers
   *     tags:
   *       - Admin
   *       - Users
   *     parameters:
   *       - $ref: '#/components/parameters/UserQuerySearch'
   *       - name: role
   *         in: query
   *         description: Optional. The role to filter the results by.
   *         schema:
   *           type: string
   *           enum:
   *             - user
   *             - admin
   *         example: user
   *       - $ref: '#/components/parameters/UserQuerySortBy'
   *       - $ref: '#/components/parameters/SortOrder'
   *       - $ref: '#/components/parameters/Skip'
   *       - $ref: '#/components/parameters/Limit'
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains the list of users matching the search criteria.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - data
   *                 - totalCount
   *               properties:
   *                 data:
   *                   type: array
   *                   description: The list of users matching the search criteria.
   *                   items:
   *                     $ref: "#/components/schemas/User"
   *                 totalCount:
   *                   type: integer
   *                   description: The total number of users matching the search criteria.
   *                   example: 18
   *       400:
   *         description: The request failed because the query string parameters were invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an admin.
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
  @Get()
  async searchUsers(
    @Query(new ZodValidator(AdminSearchUsersParamsSchema))
    params: AdminSearchUsersParamsDTO,
  ): Promise<ApiList<UserDTO>> {
    this.log.debug('Search users...', params);
    const results = await this.adminService.searchUsers(params);
    return {
      data: results.data.map((user) => user.toJSON()),
      totalCount: results.totalCount,
    };
  }

  /**
   * @openapi
   * /api/admin/users/{username}:
   *   get:
   *     summary: Get a user by username or email
   *     operationId: getUser
   *     tags:
   *       - Admin
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       200:
   *         description: The request succeeded and the response body contains the user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/User"
   *       401:
   *         description: The request failed because the current user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the current user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user was not found.
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
  @Get(`:${UsernameParam}`)
  async getUser(@Param(UsernameParam) usernameOrEmail: string) {
    const user = await this.usersService.getUserByUsernameOrEmail(
      usernameOrEmail,
    );

    if (!user) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }

    return user.toJSON();
  }

  /**
   * @openapi
   * /api/admin/users/{username}/role:
   *   post:
   *     summary: Change a user's role
   *     operationId: changeRole
   *     tags:
   *       - Admin
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new role to assign to the user.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - role
   *             properties:
   *               newRole:
   *                 type: string
   *                 description: The new role to assign to the user.
   *                 enum:
   *                   - user
   *                   - admin
   *     responses:
   *       204:
   *         description: The request succeeded and the user's role was changed.
   *       400:
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user was not found.
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
  @Post(`:${UsernameParam}/role`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeRole(
    @Param(UsernameParam) usernameOrEmail: string,
    @Body(new ZodValidator(ChangeRoleParamsSchema))
    { newRole }: ChangeRoleParams,
  ): Promise<void> {
    const result = await this.adminService.changeRole(usernameOrEmail, newRole);

    if (!result) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }
  }

  /**
   * @openapi
   * /api/admin/users/{username}/password:
   *   post:
   *     summary: Reset a user's password
   *     operationId: resetPassword
   *     tags:
   *       - Admin
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new password to assign to the user.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newPassword
   *             properties:
   *               newPassword:
   *                 type: string
   *                 description: The new password to assign to the user.
   *                 minLength: 8
   *                 maxLength: 100
   *     responses:
   *       204:
   *         description: The request succeeded and the user's password was changed.
   *       400:
   *         description: The request failed because the request body was invalid or the password did not meet strength requirements.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user was not found.
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
  @Post(`:${UsernameParam}/password`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Param(UsernameParam) usernameOrEmail: string,
    @Body(new ZodValidator(ResetPasswordParamsSchema))
    { newPassword }: ResetPasswordParams,
  ): Promise<void> {
    const result = await this.adminService.resetPassword(
      usernameOrEmail,
      newPassword,
    );

    if (!result) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }
  }

  /**
   * @openapi
   * /api/admin/users/{username}/lockAccount:
   *   post:
   *     summary: Lock a user's account
   *     operationId: lockAccount
   *     tags:
   *       - Admin
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       204:
   *         description: The request succeeded and the user's account was locked.
   *       400:
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user was not found.
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
  @Post(`:${UsernameParam}/lockAccount`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async lockUserAccount(
    @Param(UsernameParam) usernameOrEmail: string,
  ): Promise<void> {
    const result = await this.adminService.lockAccount(usernameOrEmail);

    if (!result) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }
  }

  /**
   * @openapi
   * /api/admin/users/{username}/unlockAccount:
   *   post:
   *     summary: Unlock a user's account
   *     operationId: unlockAccount
   *     tags:
   *       - Admin
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     responses:
   *       204:
   *         description: The request succeeded and the user's account was unlocked.
   *       400:
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user was not found.
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
  @Post(`:${UsernameParam}/unlockAccount`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlockUserAccount(
    @Param(UsernameParam) usernameOrEmail: string,
  ): Promise<void> {
    const result = await this.adminService.unlockAccount(usernameOrEmail);

    if (!result) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }
  }

  /**
   * @openapi
   * /api/admin/users/{username}/membership:
   *   post:
   *     summary: Change a user's account tier
   *     operationId: changeMembership
   *     tags:
   *       - Admin
   *       - Users
   *     parameters:
   *       - $ref: "#/components/parameters/Username"
   *     requestBody:
   *       description: The new account tier to assign to the user.
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newAccountTier
   *             properties:
   *               newAccountTier:
   *                 type: integer
   *                 description: |
   *                   The new account tier to assign to the user:
   *                   * 0: Free
   *                   * 100: Pro
   *                   * 200: Shop Owner
   *                 enum:
   *                   - 0
   *                   - 100
   *                   - 200
   *                 example: 100
   *     responses:
   *       204:
   *         description: The request succeeded and the user's account tier was changed.
   *       400:
   *         description: The request failed because the request body was invalid.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       401:
   *         description: The request failed because the user is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       403:
   *         description: The request failed because the user is not an admin.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       404:
   *         description: The request failed because the target user was not found.
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
  @Post(`:${UsernameParam}/membership`)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeMembership(
    @Param(UsernameParam) usernameOrEmail: string,
    @Body(new ZodValidator(ChangeMembershipParamsSchema))
    { newAccountTier }: ChangeMembershipParams,
  ): Promise<void> {
    const result = await this.adminService.changeMembership(
      usernameOrEmail,
      newAccountTier,
    );

    if (!result) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }
  }
}
