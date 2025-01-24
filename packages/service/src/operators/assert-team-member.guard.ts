import { UsernameSchema } from '@bottomtime/api';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  createParamDecorator,
} from '@nestjs/common';

import { Request } from 'express';

import { OperatorTeamMember } from './operator-team-member';

const NotFoundMessage = 'Team member not found.';

@Injectable()
export class AssertTeamMember implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.targetDiveOperator) {
      throw new NotFoundException('Dive operator not found.');
    }

    const { success } = UsernameSchema.safeParse(req.params.teamMember);
    if (!success) {
      throw new NotFoundException(NotFoundMessage);
    }

    const teamMember = await req.targetDiveOperator.teamMembers.getMember(
      req.params.teamMember,
    );
    if (!teamMember) {
      throw new NotFoundException(NotFoundMessage);
    }

    req.targetTeamMember = teamMember;
    return true;
  }
}

export const TargetTeamMember = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): OperatorTeamMember | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.targetTeamMember;
  },
);
