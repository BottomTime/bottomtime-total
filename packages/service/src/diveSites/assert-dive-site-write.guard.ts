import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '../users';
import { DiveSite } from './dive-site';
import { UserRole } from '@bottomtime/api';

@Injectable()
export class AssertDiveSiteWrite implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const user: User = req.user;
    const site: DiveSite = req.diveSite;

    if (user.role === UserRole.Admin) {
      return true;
    }

    if (site.creator.userId === user.id) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to modify or delete this dive site.',
    );
  }
}
