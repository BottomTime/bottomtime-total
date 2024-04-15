import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { User } from '../users';
import { LogEntriesService } from './log-entries.service';
import { LogEntry } from './log-entry';

@Injectable()
export class AssertTargetLogEntry implements CanActivate {
  constructor(
    @Inject(LogEntriesService) private readonly service: LogEntriesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const currentUser: User | undefined = req.targetUser;
    if (!currentUser) {
      throw new NotFoundException(
        'Unable to retrieve dive log entry. Target user information is not loaded.',
      );
    }

    const logEntryId: string = req.params.entryId;
    const logEntry = await this.service.getLogEntry(logEntryId, currentUser.id);

    if (!logEntry) {
      throw new NotFoundException(
        `Unable to find log entry with ID "${logEntryId}" belonging to user "${currentUser.username}".`,
      );
    }

    req.targetLogEntry = logEntry;
    return true;
  }
}

export const TargetLogEntry = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): LogEntry => {
    const req = ctx.switchToHttp().getRequest();
    return req.targetLogEntry;
  },
);
