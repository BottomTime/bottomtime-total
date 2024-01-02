import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const TargetFriend = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.targetFriend;
  },
);
