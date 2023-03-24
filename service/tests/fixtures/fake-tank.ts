import { faker } from '@faker-js/faker';
import { TankDocument } from '../../src/data';
import { TankMaterial } from '../../src/constants';

export function fakeTank(data?: Partial<TankDocument>): TankDocument {
  return {
    _id: data?._id ?? faker.datatype.uuid(),
    name:
      data?.name ??
      `${faker.company.bsAdjective()} ${faker.company.catchPhraseNoun()} tank #${faker.random.numeric(
        4,
      )}`,
    material:
      data?.material ?? faker.helpers.arrayElement(Object.values(TankMaterial)),
    volume: data?.volume ?? faker.datatype.float({ min: 2.7, max: 15.0 }),
    workingPressure:
      data?.workingPressure ?? faker.datatype.float({ min: 182.0, max: 237.0 }),
  };
}
