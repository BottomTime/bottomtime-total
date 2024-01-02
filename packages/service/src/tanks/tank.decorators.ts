import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Tank } from './tank';

export const SelectedTank = createParamDecorator<Tank>(
  (_: unknown, ctx: ExecutionContext): Tank => {
    const request = ctx.switchToHttp().getRequest();
    return request.selectedTank;
  },
);
