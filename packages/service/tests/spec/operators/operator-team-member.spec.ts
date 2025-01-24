import { AccountTier, LogBookSharing } from '@bottomtime/api';

import { Repository } from 'typeorm';

import {
  OperatorEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../../../src/data';
import { OperatorTeamMember } from '../../../src/operators/operator-team-member';
import { UserFactory } from '../../../src/users';
import { dataSource } from '../../data-source';
import { createTestOperator, createTestUser } from '../../utils';

describe('OperatorTeamMember class', () => {
  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;
  let Members: Repository<OperatorTeamMemberEntity>;
  let userFactory: UserFactory;

  let user: UserEntity;
  let operator: OperatorEntity;
  let data: OperatorTeamMemberEntity;
  let teamMember: OperatorTeamMember;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);
    Members = dataSource.getRepository(OperatorTeamMemberEntity);

    userFactory = new UserFactory(Users);

    user = createTestUser({
      id: '9d1cf2fc-e112-43dd-9584-5800477c2af2',
      bio: 'OMG! Diving!!',
      accountTier: AccountTier.Basic,
      avatar: 'https://example.com/avatar.jpg',
      name: 'John Doe',
      memberSince: new Date('2021-01-01T00:00:00Z'),
      experienceLevel: 'Expert',
      logBookSharing: LogBookSharing.FriendsOnly,
      location: 'San Francisco, CA',
      username: 'Diver McDiverface',
      startedDiving: '2008',
    });
    operator = createTestOperator(user);
  });

  beforeEach(async () => {
    data = {
      id: '4e237902-8ab2-40b2-b744-8b78b2261cf3',
      operator,
      teamMember: user,
      title: 'Lead Instructor',
      joined: '2021-01-01',
    };

    await Users.save(user);
    await Operators.save(operator);

    teamMember = new OperatorTeamMember(Members, userFactory, data);
  });

  it('will return properties correctly', () => {
    expect(teamMember.title).toBe(data.title);
    expect(teamMember.joined).toEqual(data.joined);
  });

  it('will return null properties correctly', () => {
    data.title = null;
    data.joined = null;
    expect(teamMember.title).toBeUndefined();
    expect(teamMember.joined).toBeUndefined();
  });

  it('will render as JSON', () => {
    expect(teamMember.toJSON()).toMatchSnapshot();
  });

  it('will save a new team member', async () => {
    await teamMember.save();
    const saved = await Members.findOneOrFail({
      where: { id: data.id },
      relations: ['teamMember', 'operator'],
    });
    expect(saved.title).toBe(data.title);
    expect(saved.joined).toEqual(data.joined);
    expect(saved.teamMember?.id).toBe(user.id);
    expect(saved.operator?.id).toBe(operator.id);
  });

  it('will update an existing team member', async () => {
    await Members.save(data);

    const newTitle = 'Dive Master';
    const newJoined = '2024-04-04';
    teamMember.title = newTitle;
    teamMember.joined = newJoined;
    await teamMember.save();

    const saved = await Members.findOneOrFail({
      where: { id: data.id },
      relations: ['teamMember', 'operator'],
    });
    expect(saved.title).toBe(newTitle);
    expect(saved.joined).toEqual(newJoined);
    expect(saved.teamMember?.id).toBe(user.id);
    expect(saved.operator?.id).toBe(operator.id);
  });

  it('will delete a team member', async () => {
    await Members.save(data);
    await teamMember.delete();
    await expect(Members.findOneBy({ id: data.id })).resolves.toBeNull();
  });

  it('will do nothing if deleting a team member that does not exist', async () => {
    await teamMember.delete();
  });
});
