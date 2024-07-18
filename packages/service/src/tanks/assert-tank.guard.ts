import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { User } from '../users';
import { Tank } from './tank';
import { TanksService } from './tanks.service';

@Injectable()
export class AssertTank implements CanActivate {
  constructor(
    @Inject(TanksService) private readonly tanksService: TanksService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const targetUser: User = req.targetUser;
    const tank = await this.tanksService.getTank(req.params.tankId);

    if (!tank || tank.user?.userId !== targetUser.id) {
      throw new NotFoundException(
        `Unable to find tank profile with ID "${req.params.username}".`,
      );
    }

    req.selectedTank = tank;
    return true;
  }
}

export const SelectedTank = createParamDecorator<Tank>(
  (_: unknown, ctx: ExecutionContext): Tank => {
    const request = ctx.switchToHttp().getRequest();
    return request.selectedTank;
  },
);
