import { faker } from '@faker-js/faker';

import { FriendRequestEntity, UserEntity } from '../../src/data';

export function createTestFriendRequest(
  from: string,
  to: string,
  options?: Partial<FriendRequestEntity>,
): FriendRequestEntity {
  const data = new FriendRequestEntity();

  data.id = options?.id ?? faker.string.uuid();
  data.to = { id: to } as UserEntity;
  data.from = { id: from } as UserEntity;

  data.created = options?.created ?? faker.date.recent({ days: 60 });
  data.expires = options?.expires ?? faker.date.soon({ days: 90 });

  data.accepted =
    options?.accepted ??
    faker.helpers.maybe(() => faker.datatype.boolean(), {
      probability: 0.05,
    }) ??
    null;
  data.reason =
    options?.reason ??
    (data.accepted === false
      ? faker.helpers.maybe(() => faker.lorem.sentence(), {
          probability: 0.75,
        }) ?? null
      : null);

  return data;
}
