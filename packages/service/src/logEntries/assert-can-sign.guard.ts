import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { User } from '../users';

export class AssertCanSign implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // 1) Target logbook and buddy must be identified and initialized before this guard is invoked.
    if (!req.targetUser) {
      throw new InternalServerErrorException(
        'Target user not initialized. Use AssertTargetUser guard before AssertCanSign.',
      );
    }

    if (!req.targetBuddy) {
      throw new InternalServerErrorException(
        'Buddy not initialized. Use AssertBuddy guard before AssertCanSign.',
      );
    }

    // 2) Anonymous users cannot sign log entries.
    if (!(req.user instanceof User)) {
      throw new UnauthorizedException(
        'You must be logged in to sign logbook entries.',
      );
    }

    // 3) Admins can do whatever they want.
    if (req.user.role === UserRole.Admin) {
      return true;
    }

    // 4) Users cannot sign log entries on behalf of other users
    if (req.user.id !== req.targetBuddy.id) {
      throw new ForbiddenException(
        'You are not authorized to sign log entries on behalf of other users.',
      );
    }

    // 5) Users cannot sign their own log entries.
    if (req.targetBuddy.id === req.targetUser.id) {
      throw new ForbiddenException(
        'You are not authorized to sign your own log entries.',
      );
    }

    return true;
  }
}
