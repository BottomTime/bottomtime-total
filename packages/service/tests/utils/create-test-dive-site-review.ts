import { faker } from '@faker-js/faker';

import { z } from 'zod';

import {
  DiveSiteEntity,
  DiveSiteReviewEntity,
  UserEntity,
} from '../../src/data';

const DiveSiteReviewSchema = z.object({
  id: z.string(),
  createdOn: z.coerce.date(),
  updatedOn: z.coerce.date(),
  rating: z.number(),
  difficulty: z.number().nullable().optional().default(null),
  comments: z.string().nullable().optional().default(null),
});

export function createTestDiveSiteReview(
  creator: UserEntity,
  site: DiveSiteEntity,
  options?: Partial<DiveSiteReviewEntity>,
): DiveSiteReviewEntity {
  const createdOn = options?.createdOn ?? faker.date.past({ years: 5 });
  const comments =
    faker.helpers.maybe(() => faker.lorem.paragraph(2), { probability: 0.8 }) ??
    null;

  const data = new DiveSiteReviewEntity();

  data.id = options?.id ?? faker.string.uuid();
  data.creator = creator;
  data.site = site;
  data.createdOn = createdOn;
  data.updatedOn =
    options?.updatedOn ??
    faker.date.between({ from: createdOn, to: new Date() });
  data.rating =
    options?.rating ?? faker.number.float({ min: 1, max: 5, multipleOf: 0.01 });
  data.difficulty =
    options?.difficulty ??
    faker.helpers.maybe(
      () => faker.number.float({ min: 1, max: 5, multipleOf: 0.01 }),
      {
        probability: 0.7,
      },
    ) ??
    null;
  data.comments = options?.comments || comments;

  return data;
}

export function parseDiveSiteReviewJSON(
  json: unknown,
  creator: UserEntity,
  site: DiveSiteEntity,
): DiveSiteReviewEntity {
  const data = DiveSiteReviewSchema.parse(json);
  return createTestDiveSiteReview(creator, site, data);
}
