import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { User } from '../users';

@Injectable()
export class AssertDiveSiteWrite implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const currentUser = req.user instanceof User ? req.user : undefined;
    const site = req.targetDiveSite;

    if (!currentUser) {
      throw new UnauthorizedException(
        'You must be logged in to modify or delete a dive site.',
      );
    }

    if (!site) {
      throw new NotFoundException('Dive site not found');
    }

    if (currentUser.role === UserRole.Admin) {
      return true;
    }

    if (site.creator.userId === currentUser.id) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have permission to modify or delete this dive site.',
    );
  }
}
