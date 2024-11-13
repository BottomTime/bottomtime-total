import { Feature } from '@bottomtime/common';

import {
  CanActivate,
  ExecutionContext,
  Inject,
  NotImplementedException,
} from '@nestjs/common';

import { User } from '../users';
import { FeaturesService } from './features.service';

export abstract class AssertFeature implements CanActivate {
  constructor(
    @Inject(FeaturesService) private readonly features: FeaturesService,
  ) {}

  protected abstract feature: Feature<boolean>;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user instanceof User ? req.user : undefined;

    const feature = await this.features.getFeature(this.feature, user);
    if (!feature) {
      throw new NotImplementedException('Feature is not yet implemented');
    }

    return true;
  }
}
