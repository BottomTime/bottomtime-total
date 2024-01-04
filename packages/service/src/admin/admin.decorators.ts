import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Certification } from '../certifications';

export const TargetCertification = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Certification => {
    const req = ctx.switchToHttp().getRequest();
    return req.targetCertification;
  },
);
