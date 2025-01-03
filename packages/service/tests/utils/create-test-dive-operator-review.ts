import { faker } from '@faker-js/faker';

import { z } from 'zod';

import {
  LogEntryEntity,
  OperatorEntity,
  OperatorReviewEntity,
  UserEntity,
} from '../../src/data';

const OperatorReviewSchema = z.object({
  id: z.string(),
  comments: z.string().nullable(),
  rating: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export function createTestDiveOperatorReview(
  operator: OperatorEntity,
  creator: UserEntity,
  options?: Partial<OperatorReviewEntity>,
): OperatorReviewEntity {
  const createdAt = options?.createdAt ?? faker.date.past({ years: 3 });
  return {
    creator: { id: creator.id } as UserEntity,
    operator: { id: operator.id } as OperatorEntity,

    id: options?.id ?? faker.string.uuid(),
    comments: options?.comments ?? faker.lorem.paragraphs(3),
    rating:
      options?.rating ??
      faker.number.float({ min: 1, max: 5, fractionDigits: 2 }),
    createdAt,
    updatedAt:
      options?.updatedAt ?? faker.date.soon({ days: 40, refDate: createdAt }),
    logEntry: options?.logEntry ?? null,
  };
}

export function parseOperatorReviewJSON(
  data: unknown,
  operator: OperatorEntity,
  creator: UserEntity,
  logEntry?: LogEntryEntity,
): OperatorReviewEntity {
  return {
    ...OperatorReviewSchema.parse(data),
    operator,
    creator,
    logEntry: logEntry ?? null,
  };
}
