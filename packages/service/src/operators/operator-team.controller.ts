import { TeamMemberDTO } from '@bottomtime/api';

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { AssertOperator } from './assert-operator.guard';
import { AssertTeamMember, TargetTeamMember } from './assert-team-member.guard';
import { OperatorTeamMember } from './operator-team-member';

const TeamMemberKey = ':teamMember';

@Controller('api/operators/:operatorKey/team')
@UseGuards(AssertOperator)
export class OperatorTeamController {
  @Get()
  listTeamMembers() {}

  @Post()
  @HttpCode(HttpStatus.OK)
  addTeamMember() {}

  @Delete()
  removeTeamMembers() {}

  @Get(TeamMemberKey)
  @UseGuards(AssertTeamMember)
  getTeamMember(
    @TargetTeamMember() teamMember: OperatorTeamMember,
  ): TeamMemberDTO {
    return teamMember.toJSON();
  }

  @Put(TeamMemberKey)
  updateTeamMember() {}

  @Delete(TeamMemberKey)
  removeTeamMember() {}
}
