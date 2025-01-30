import { faker } from '@faker-js/faker';

import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  UserEntity,
} from '../../../src/data';

export function fakeDiveSiteReview(
  userIds: string[],
  siteIds: string[],
): DiveSiteReviewEntity {
  const createdOn = faker.date.past({ years: 5 });
  return {
    comments: faker.lorem.paragraphs(2),
    createdOn,
    creator: { id: faker.helpers.arrayElement(userIds) } as UserEntity,
    difficulty: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    id: faker.string.uuid(),
    logEntry: null,
    rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    site: { id: faker.helpers.arrayElement(siteIds) } as DiveSiteEntity,
    updatedOn: faker.date.between({ from: createdOn, to: new Date() }),
  };
}
