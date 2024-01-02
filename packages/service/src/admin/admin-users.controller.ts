import {
  AdminSearchUsersParams,
  AdminSearchUsersParamsSchema,
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
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { AssertAdmin } from '../auth';
import { ZodValidator } from '../zod-validator';

const UsernameOrEmailParam = 'usernameOrEmail';

@Controller('api/admin/users')
@UseGuards(AssertAdmin)
export class AdminUsersController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async searchUsers(
    @Query(new ZodValidator(AdminSearchUsersParamsSchema))
    params: AdminSearchUsersParams,
  ): Promise<UserDTO[]> {
    return [];
  }

  @Post(`:${UsernameOrEmailParam}/role`)
  @HttpCode(204)
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
