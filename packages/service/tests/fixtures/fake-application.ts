import { faker } from '@faker-js/faker';
import { ApplicationDocument } from '../../src/data';

export function fakeApplication(
  data?: Partial<ApplicationDocument>,
): ApplicationDocument {
  const doc: ApplicationDocument = {
    _id: data?._id ?? faker.datatype.uuid(),
    active: data?.active ?? faker.datatype.boolean(),
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

  if (data?.allowedOrigins) {
    doc.allowedOrigins = data.allowedOrigins;
  }

  return doc;
}
