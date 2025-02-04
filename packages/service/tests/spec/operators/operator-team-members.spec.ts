import { Repository } from 'typeorm';

import {
  OperatorEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../../../src/data';
import { OperatorTeamMembers } from '../../../src/operators/operator-team-members';
import { UserFactory } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestUsers from '../../fixtures/user-search-data.json';
import {
  createTestOperator,
  createTestTeamMember,
  createTestUser,
  parseUserJSON,
} from '../../utils';
import { createUserFactory } from '../../utils/create-user-factory';

describe('OperatorTeamMembers class', () => {
  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;
  let TeamMembers: Repository<OperatorTeamMemberEntity>;
  let userFactory: UserFactory;

  let userData: UserEntity[];
  let operator: OperatorEntity;
  let otherOperator: OperatorEntity;
  let otherUser: UserEntity;
  let teamMemberData: OperatorTeamMemberEntity[];

  let teamMembers: OperatorTeamMembers;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);
    TeamMembers = dataSource.getRepository(OperatorTeamMemberEntity);
    userFactory = createUserFactory();

    userData = TestUsers.slice(0, 10).map((user) => parseUserJSON(user));
    otherUser = createTestUser();
    operator = createTestOperator(userData[0]);
    otherOperator = createTestOperator(userData[1]);

    teamMemberData = userData
      .map((user) => createTestTeamMember(operator, user))
      .sort((a, b) => b.joined!.localeCompare(a.joined!));
    teamMemberData.push(createTestTeamMember(otherOperator, userData[1]));
    teamMemberData.push(createTestTeamMember(otherOperator, otherUser));

    teamMembers = new OperatorTeamMembers(
      TeamMembers,
      Users,
      userFactory,
      operator,
    );
  });

  beforeEach(async () => {
    await Users.save([...userData, otherUser]);
    await Operators.save([operator, otherOperator]);
    await TeamMembers.save(teamMemberData);
  });

  it('will retrieve a single team member', async () => {
    const member = await teamMembers.getMember(
      teamMemberData[1].teamMember!.username,
    );
    expect(member).toBeDefined();
    expect(member!.title).toBe(teamMemberData[1].title);
    expect(member!.joined).toEqual(teamMemberData[1].joined);
    expect(member!.member.username).toBe(
      teamMemberData[1].teamMember!.username,
    );
  });

  it('will return undefined when requesting a team member that does not exist', async () => {
    await expect(
      teamMembers.getMember('not_a_real_user'),
    ).resolves.toBeUndefined();
  });

  it('will list all members for a dive operator', async () => {
    const members = await teamMembers.listMembers();
    expect(members).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(members[i].title).toBe(teamMemberData[i].title);
      expect(members[i].joined).toEqual(teamMemberData[i].joined);
      expect(members[i].member.username).toBe(
        teamMemberData[i].teamMember!.username,
      );
    }
  });

  it('will return an empty list if the operator has no team members', async () => {
    await TeamMembers.delete({});
    await expect(teamMembers.listMembers()).resolves.toEqual([]);
  });

  it('will add a new member to a dive operator', async () => {
    const title = 'Technical Instructor';
    const joined = '2025-01-15';
    const userData = createTestUser();

    await Users.save(userData);

    const member = await teamMembers.addMember({
      title,
      joined,
      member: userFactory.createUser(userData),
    });

    expect(member.title).toBe(title);
    expect(member.joined).toEqual(joined);
    expect(member.member.username).toBe(userData.username);

    const saved = await TeamMembers.findOneByOrFail({
      operator: { id: operator.id },
      teamMember: { id: userData.id },
    });
    expect(saved.title).toBe(title);
    expect(saved.joined).toEqual(joined);
  });

  it('will bulk delete team members', async () => {
    const usernames = [
      teamMemberData[3].teamMember!.username,
      teamMemberData[5].teamMember!.username,
      teamMemberData[7].teamMember!.username,
      'not_a_real_user',
      otherUser.username,
    ];

    await expect(teamMembers.removeMembers(usernames)).resolves.toBe(3);

    const remaining = await TeamMembers.find({
      where: { operator: { id: operator.id } },
      relations: ['teamMember'],
    });
    expect(remaining).toHaveLength(7);

    const remainingUsernames = new Set(
      remaining.map((member) => member.teamMember!.username),
    );
    expect(remainingUsernames.has(teamMemberData[3].teamMember!.username)).toBe(
      false,
    );
    expect(remainingUsernames.has(teamMemberData[5].teamMember!.username)).toBe(
      false,
    );
    expect(remainingUsernames.has(teamMemberData[7].teamMember!.username)).toBe(
      false,
    );
  });
});
