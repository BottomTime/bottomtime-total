import { faker } from '@faker-js/faker';

import { FriendRequestEntity, UserEntity } from 'src/data';

import { possibly } from './possibly';

export function fakeFriendRequest(
  userIds: string[],
  friendIds: string[],
): FriendRequestEntity {
  const data = new FriendRequestEntity();

  data.id = faker.datatype.uuid();
  data.from = { id: faker.helpers.arrayElement(userIds) } as UserEntity;
  data.to = { id: faker.helpers.arrayElement(friendIds) } as UserEntity;

  data.created = faker.date.recent(7);
  data.expires = faker.date.soon(180);
  data.accepted = possibly(() => faker.datatype.boolean(), 0.1) ?? null;
  if (data.accepted === false) {
    data.reason = faker.lorem.sentence();
  }

  return data;
}
