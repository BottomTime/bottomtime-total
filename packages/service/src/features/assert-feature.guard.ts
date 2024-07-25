import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { FeaturesService } from './features.service';

@Injectable()
export class AssertFeature implements CanActivate {
  constructor(
    @Inject(FeaturesService) private readonly service: FeaturesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const feature = await this.service.getFeature(req.params.featureKey);

    if (!feature) {
      throw new NotFoundException(
        `Feature flag with key "${req.params.featureKey}" not found.`,
      );
    }

    req.feature = feature;
    return true;
  }
}

export const TargetFeature = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.feature;
  },
);
