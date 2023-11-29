import {
  Controller,
  Head,
  Logger,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly log = new Logger(UsersController.name);

  constructor(private readonly users: UsersService) {}

  @Head(':id')
  async isUsernameOrEmailAvailable(
    @Param('id') usernameOrEmail: string,
  ): Promise<void> {
    const user = await this.users.getUserByUsernameOrEmail(usernameOrEmail);
    if (!user) {
      throw new NotFoundException('Username or email address was not found');
    }
  }
}
