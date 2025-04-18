import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';
import { z } from 'zod';

import { LogEntryImport } from './log-entry-import';
import { LogEntryImportService } from './log-entry-import.service';

@Injectable()
export class AssertTargetImport implements CanActivate {
  constructor(
    @Inject(LogEntryImportService)
    private readonly service: LogEntryImportService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const importId = z.string().trim().uuid().safeParse(req.params.importId);

    if (!importId.success) {
      throw new BadRequestException('Invalid import ID');
    }

    const importEntity = await this.service.getImport(importId.data);
    if (!importEntity) {
      throw new NotFoundException(
        `Requested import ("${importId.data}") not found.`,
      );
    }

    req.targetLogEntryImport = importEntity;
    return true;
  }
}

export const TargetImport = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): LogEntryImport | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetLogEntryImport;
  },
);
