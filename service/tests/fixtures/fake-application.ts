import { faker } from '@faker-js/faker';
import { ApplicationDocument } from '../../src/data';

export function fakeApplication(
  data?: Partial<ApplicationDocument>,
): ApplicationDocument {
  return {
    _id: data?._id ?? faker.datatype.uuid(),
    active: data?.active ?? faker.datatype.boolean(),
    allowedOrigins: data?.allowedOrigins,
    created: data?.created ?? faker.date.past(4),
    name:
      data?.name ??
      `${faker.company.bsAdjective()} ${faker.company.bsNoun()} #${faker.random.numeric(
        4,
      )}`,
    description: data?.description ?? faker.lorem.sentences(2),
    token: data?.token ?? faker.random.alphaNumeric(24),
    user: data?.user ?? faker.datatype.uuid(),
  };
}
