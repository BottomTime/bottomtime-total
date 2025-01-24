import { faker } from '@faker-js/faker';

import {
  OperatorEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../../src/data';

export function createTestTeamMember(
  operator: OperatorEntity,
  teamMember: UserEntity,
): OperatorTeamMemberEntity {
  return {
    id: faker.string.uuid(),
    operator,
    teamMember,
    title: faker.helpers.arrayElement([
      'Instructor',
      'Divemaster',
      'Staff',
      'Owner',
      'Manager',
    ]),
    joined: faker.date.past({ years: 6 }),
  };
}
