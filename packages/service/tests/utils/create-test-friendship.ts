import { faker } from '@faker-js/faker';

import { FriendshipEntity, UserEntity } from '../../src/data';

export function createTestFriendship(
  userId: string,
  friendId: string,
): FriendshipEntity {
  const friendship = new FriendshipEntity();

  friendship.id = faker.string.uuid();
  friendship.user = { id: userId } as UserEntity;
  friendship.friend = { id: friendId } as UserEntity;
  friendship.friendsSince = faker.date.past({ years: 3 });

  return friendship;
}
