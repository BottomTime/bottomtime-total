import {
  AdminSearchUsersParams,
  AdminSearchUsersParamsSchema,
  ChangeRoleParams,
  ChangeRoleParamsSchema,
  ResetPasswordParams,
  ResetPasswordParamsSchema,
  SortOrder,
  SuccessResponse,
  SuccessResponseSchema,
  UserDTO,
  UserRole,
  UserSchema,
  UsersSortBy,
} from '@bottomtime/api';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { AssertAdmin } from '../auth';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidator } from '../zod-validator';
import { generateSchema } from '@anatine/zod-openapi';

const UsernameOrEmailParam = 'usernameOrEmail';

@UseGuards(AssertAdmin)
@ApiTags('Admin')
@ApiUnauthorizedResponse({
  description: 'The request was rejected because the user was not logged in.',
})
@ApiForbiddenResponse({
  description:
    'The request was rejected because the user is not an administrator.',
})
@ApiInternalServerErrorResponse({
  description: 'The request failed because of an internal server error.',
})
@Controller('api/admin/users')
export class AdminUsersController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Search Users',
    description: 'Searches or lists registered users',
  })
  @ApiQuery({
    name: 'query',
    description:
      'A query string to use to search for users. Usernames, emails, and profile info will be searched.',
    schema: generateSchema(AdminSearchUsersParamsSchema.shape.query),
    example: 'billy',
    required: false,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'The field on which to sort the results.',
    schema: generateSchema(AdminSearchUsersParamsSchema.shape.sortBy),
    example: UsersSortBy.Username,
    required: false,
  })
  @ApiQuery({
    name: 'sortOrder',
    description:
      'The order in which to sort the results. (Ascending or descending)',
    schema: generateSchema(AdminSearchUsersParamsSchema.shape.sortOrder),
    example: SortOrder.Ascending,
    required: false,
  })
  @ApiQuery({
    name: 'role',
    description: 'Filters the search results by user role.',
    schema: generateSchema(AdminSearchUsersParamsSchema.shape.role),
    example: UserRole.User,
    required: false,
  })
  @ApiQuery({
    name: 'skip',
    description: 'The number of results to skip before returning results.',
    schema: generateSchema(AdminSearchUsersParamsSchema.shape.skip),
    example: 250,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'The maximum number of results to return.',
    schema: generateSchema(AdminSearchUsersParamsSchema.shape.limit),
    example: 100,
    required: false,
  })
  @ApiOkResponse({
    schema: generateSchema(UserSchema.array()),
    description:
      'The search has completed successfully. The results will be returned in the response body.',
  })
  @ApiBadRequestResponse({ description: 'The query string was invalid.' })
  async searchUsers(
    @Query(new ZodValidator(AdminSearchUsersParamsSchema))
    params: AdminSearchUsersParams,
  ): Promise<UserDTO[]> {
    return [];
  }

  @Post(`:${UsernameOrEmailParam}/role`)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Change Role',
    description: "Change a user's security role.",
  })
  @ApiParam({
    name: 'usernameOrEmail',
    description: 'The username or email address of the user.',
    type: 'string',
    example: 'billy32',
  })
  @ApiBody({
    description: 'The new role to assign to the user.',
    schema: generateSchema(ChangeRoleParamsSchema),
  })
  @ApiNoContentResponse({
    description: "The user's role was successfully changed.",
  })
  @ApiNotFoundResponse({ description: 'The user was not found.' })
  async changeRole(
    @Param(UsernameOrEmailParam) usernameOrEmail: string,
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

  @Post(`:${UsernameOrEmailParam}/password`)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Reset Password',
    description: "Reset a user's password.",
  })
  @ApiParam({
    name: 'usernameOrEmail',
    description: 'The username or email address of the user.',
    type: 'string',
    example: 'billy32',
  })
  @ApiBody({
    description: "The new password to set on the user's account.",
    schema: generateSchema(ResetPasswordParamsSchema),
  })
  @ApiNoContentResponse({
    description: "The user's password was successfully changed.",
  })
  @ApiBadRequestResponse({
    description:
      'The request body was invalid or the new password did not meet strength requirements.',
  })
  @ApiNotFoundResponse({ description: 'The user was not found.' })
  async resetPassword(
    @Param(UsernameOrEmailParam) usernameOrEmail: string,
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

  @Post(`:${UsernameOrEmailParam}/lockAccount`)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Lock Account',
    description: "Lock (suspend) a user's account.",
  })
  @ApiParam({
    name: 'usernameOrEmail',
    description: 'The username or email address of the user.',
    type: 'string',
    example: 'billy32',
  })
  @ApiNoContentResponse({
    description: "The user's account was successfully suspended.",
  })
  @ApiNotFoundResponse({ description: 'The user was not found.' })
  async lockUserAccount(
    @Param(UsernameOrEmailParam) usernameOrEmail: string,
  ): Promise<void> {
    const result = await this.adminService.lockAccount(usernameOrEmail);

    if (!result) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }
  }

  @Post(`:${UsernameOrEmailParam}/unlockAccount`)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Unlock Account',
    description: "Unlock a user's account.",
  })
  @ApiParam({
    name: 'usernameOrEmail',
    description: 'The username or email address of the user.',
    type: 'string',
    example: 'billy32',
  })
  @ApiNoContentResponse({
    description: "The user's account was successfully unlocked.",
  })
  @ApiNotFoundResponse({ description: 'The user was not found.' })
  async unlockUserAccount(
    @Param(UsernameOrEmailParam) usernameOrEmail: string,
  ): Promise<void> {
    const result = await this.adminService.unlockAccount(usernameOrEmail);

    if (!result) {
      throw new NotFoundException(
        `Username or email not found: ${usernameOrEmail}`,
      );
    }
  }
}
