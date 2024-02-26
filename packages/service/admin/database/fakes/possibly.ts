import { faker } from '@faker-js/faker';

export function possibly<T>(fn: () => T, probability: number): T | undefined {
  return faker.helpers.maybe(fn, { probability });
}
