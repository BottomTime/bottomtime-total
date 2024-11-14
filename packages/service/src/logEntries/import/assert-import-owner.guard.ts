import { UserRole } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Observable } from 'rxjs';

import { User } from '../../users';
import { LogEntryImport } from './log-entry-import';

export class AssertImportOwner implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const currentUser: User | undefined =
      req.user instanceof User ? req.user : undefined;
    const currentImport: LogEntryImport | undefined =
      req.import instanceof LogEntryImport ? req.import : undefined;

    // User must be logged in
    if (!currentUser) {
      throw new UnauthorizedException(
        'You must be logged in to perfrom this operation',
      );
    }

    // Import must exist
    if (!currentImport) {
      throw new NotFoundException('Import session not found.');
    }

    // Admins are always authorized
    if (currentUser.role === UserRole.Admin) return true;

    // User must be the owner of the import session
    return currentUser.id === currentImport.owner.id;
  }
}
