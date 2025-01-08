import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { Tank } from './tank';
import { TanksService } from './tanks.service';

@Injectable()
export class AssertTank implements CanActivate {
  constructor(
    @Inject(TanksService) private readonly tanksService: TanksService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const targetUser = req.targetUser;
    if (!targetUser) {
      throw new NotFoundException('Unable to find user profile.');
    }

    const tank = await this.tanksService.getTank(req.params.tankId);

    if (!tank || tank.user?.userId !== targetUser.id) {
      throw new NotFoundException(
        `Unable to find tank profile with ID "${req.params.username}".`,
      );
    }

    req.targetTank = tank;
    return true;
  }
}

export const SelectedTank = createParamDecorator<Tank>(
  (_: unknown, ctx: ExecutionContext): Tank | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.targetTank;
  },
);
