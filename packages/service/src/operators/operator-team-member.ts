import { TeamMemberDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { OperatorTeamMemberEntity } from '../data';
import { User, UserFactory } from '../users';

export class OperatorTeamMember {
  constructor(
    private readonly members: Repository<OperatorTeamMemberEntity>,
    private readonly userFactory: UserFactory,
    private readonly data: OperatorTeamMemberEntity,
  ) {}

  get title(): string | undefined {
    return this.data.title ?? undefined;
  }
  set title(value: string | undefined) {
    this.data.title = value ?? null;
  }

  get joined(): string | undefined {
    return this.data.joined ?? undefined;
  }
  set joined(value: string | undefined) {
    this.data.joined = value ?? null;
  }

  get member(): User {
    if (!this.data.teamMember) {
      throw new Error('Team member not loaded');
    }
    return this.userFactory.createUser(this.data.teamMember);
  }

  async save(): Promise<void> {
    await this.members.save(this.data);
  }

  async delete(): Promise<void> {
    await this.members.delete(this.data.id);
  }

  toJSON(): TeamMemberDTO {
    return {
      title: this.title,
      joined: this.joined?.valueOf(),
      member: this.member.profile.toJSON(),
    };
  }
}
