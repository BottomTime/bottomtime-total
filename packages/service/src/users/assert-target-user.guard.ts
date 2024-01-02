import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class AssertTargetUser implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const targetUser = await this.usersService.getUserByUsernameOrEmail(
      req.params.username,
    );

    if (!targetUser) {
      throw new NotFoundException(`User ${req.params.username} not found.`);
    }

    req.targetUser = targetUser;
    return true;
  }
}
