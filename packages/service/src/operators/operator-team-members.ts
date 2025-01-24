import { CreateOrUpdateTeamMemberDTO } from '@bottomtime/api';

import { Logger } from '@nestjs/common';

import { In, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { OperatorEntity, OperatorTeamMemberEntity, UserEntity } from '../data';
import { User, UserFactory } from '../users';
import { OperatorTeamMember } from './operator-team-member';

export type AddTeamMemberOptions = CreateOrUpdateTeamMemberDTO & {
  member: User;
};

export class OperatorTeamMembers {
  private readonly log = new Logger(OperatorTeamMembers.name);

  constructor(
    private readonly teamMembers: Repository<OperatorTeamMemberEntity>,
    private readonly users: Repository<UserEntity>,
    private readonly userFactory: UserFactory,
    private readonly data: OperatorEntity,
  ) {}

  async getMember(username: string): Promise<OperatorTeamMember | undefined> {
    this.log.debug(
      `Attempting to retrieve team member "${username}" for dive operator ${this.data.name}...`,
    );
    const data = await this.teamMembers.findOne({
      where: {
        operator: { id: this.data.id },
        teamMember: { usernameLowered: username.trim().toLowerCase() },
      },
      relations: ['teamMember'],
    });

    if (data) {
      return new OperatorTeamMember(this.teamMembers, this.userFactory, {
        ...data,
        operator: this.data,
      });
    }

    return undefined;
  }

  async listMembers(): Promise<OperatorTeamMember[]> {
    this.log.debug(
      `Attempting to retrieve team members for dive operator ${this.data.name}...`,
    );
    const data = await this.teamMembers.find({
      where: {
        operator: { id: this.data.id },
      },
      relations: ['teamMember'],
      order: {
        joined: { direction: 'desc', nulls: 'last' },
      },
    });

    return data.map(
      (member) =>
        new OperatorTeamMember(this.teamMembers, this.userFactory, {
          ...member,
          operator: this.data,
        }),
    );
  }

  async addMember(options: AddTeamMemberOptions): Promise<OperatorTeamMember> {
    const teamMember = new OperatorTeamMember(
      this.teamMembers,
      this.userFactory,
      {
        id: uuid(),
        joined: options.joined ?? null,
        title: options.title ?? null,
        teamMember: options.member.toEntity(),
        operator: this.data,
      },
    );

    await teamMember.save();
    return teamMember;
  }

  async removeMembers(usernames: string[]): Promise<number> {
    const users = await this.users.find({
      where: {
        usernameLowered: In(usernames.map((u) => u.trim().toLowerCase())),
      },
      select: { id: true },
    });
    const { affected } = await this.teamMembers.delete({
      operator: { id: this.data.id },
      teamMember: {
        id: In(users.map((u) => u.id)),
      },
    });

    return typeof affected === 'number' ? affected : 0;
  }
}
