import { LogImportFeature } from '@bottomtime/common';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';

import { FeaturesService } from '../features';
import { User } from '../users';

@Injectable()
export class ImportFeatureGuard implements CanActivate {
  constructor(private readonly features: FeaturesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user instanceof User ? req.user : undefined;

    const feature = await this.features.getFeature(LogImportFeature, user);
    if (!feature) {
      throw new NotImplementedException('Feature is not yet implemented');
    }

    return true;
  }
}
