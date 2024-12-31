import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { User } from '../users';
import { LogEntriesService } from './log-entries.service';
import { LogEntry } from './log-entry';

@Injectable()
export class AssertTargetLogEntry implements CanActivate {
  constructor(
    @Inject(LogEntriesService) private readonly service: LogEntriesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const targetUser: User | undefined = req.targetUser;
    if (!targetUser) {
      throw new NotFoundException(
        'Unable to retrieve dive log entry. Target user information is not loaded.',
      );
    }

    const logEntryId: string = req.params.entryId;
    const logEntry = await this.service.getLogEntry(logEntryId, targetUser.id);

    if (!logEntry) {
      throw new NotFoundException(
        `Unable to find log entry with ID "${logEntryId}" belonging to user "${targetUser.username}".`,
      );
    }

    req.targetLogEntry = logEntry;
    return true;
  }
}

export const TargetLogEntry = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): LogEntry | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetLogEntry;
  },
);
