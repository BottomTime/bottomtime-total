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
export class AssertOperatorReviewOwner implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const currentUser = req.user instanceof User ? req.user : undefined;
    const review = req.targetDiveOperatorReview;

    if (!review) {
      throw new NotFoundException('Dive operator review not found.');
    }

    if (!currentUser) {
      throw new UnauthorizedException(
        'You must be logged in to perform this action.',
      );
    }

    if (currentUser.role === UserRole.Admin) return true;

    if (review.creator.userId !== currentUser.id) {
      throw new ForbiddenException(
        'You are not authorized to modify or delete this review.',
      );
    }

    return true;
  }
}
