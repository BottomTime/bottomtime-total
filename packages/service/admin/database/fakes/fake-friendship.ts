import { faker } from '@faker-js/faker';

import { FriendshipEntity, UserEntity } from '../../../src/data';

export function fakeFriendship(
  userIds: string[],
  friendIds: string[],
): FriendshipEntity {
  const data = new FriendshipEntity();

  data.id = faker.datatype.uuid();
  data.friendsSince = faker.date.past(5);
  data.user = { id: faker.helpers.arrayElement(userIds) } as UserEntity;
  data.friend = { id: faker.helpers.arrayElement(friendIds) } as UserEntity;

  return data;
}
