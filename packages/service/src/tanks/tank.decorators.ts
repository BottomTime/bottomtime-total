import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Tank } from './tank';
import { User } from '../users/user';

export const SelectedTank = createParamDecorator<Tank>(
  (_: unknown, ctx: ExecutionContext): Tank => {
    const request = ctx.switchToHttp().getRequest();
    return request.selectedTank;
  },
);

export const TargetUser = createParamDecorator<User>(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.targetUser;
  },
);
