import { faker } from '@faker-js/faker';

import {
  OperatorEntity,
  OperatorReviewEntity,
  UserEntity,
} from '../../../src/data';

export function fakeDiveOperatorReview(
  userIds: string[],
  operatorIds: string[],
): OperatorReviewEntity {
  const createdAt = faker.date.past({ years: 3 });
  const review: OperatorReviewEntity = {
    comments: faker.lorem.paragraphs(3),
    createdAt,
    creator: { id: faker.helpers.arrayElement(userIds) } as UserEntity,
    id: faker.string.uuid(),
    operator: { id: faker.helpers.arrayElement(operatorIds) } as OperatorEntity,
    rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    logEntry: null,
    updatedAt: createdAt,
  };
  return review;
}
