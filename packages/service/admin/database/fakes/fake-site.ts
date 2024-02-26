import { DepthDTO, DepthUnit } from '@bottomtime/api';

import { DiveSiteDocument, DiveSiteModel } from '@/schemas';
import { faker } from '@faker-js/faker';

import { possibly } from './possibly';

export function fakeDepth(): DepthDTO {
  const unit = faker.helpers.arrayElement([DepthUnit.Feet, DepthUnit.Meters]);
  const depth =
    unit === DepthUnit.Feet
      ? faker.datatype.number({ min: 20, max: 145, precision: 0.1 })
      : faker.datatype.number({ min: 6, max: 44, precision: 0.01 });

  return { depth, unit };
}

export function fakeDiveSite(userIds: string[]): DiveSiteDocument {
  return new DiveSiteModel({
    _id: faker.datatype.uuid(),
    creator: faker.helpers.arrayElement(userIds),
    createdOn: faker.date.past(5),
    updatedOn: possibly(() => faker.date.past(2), 0.5),

    name: `${faker.word.adjective()}, ${faker.word.adjective()} ${faker.word.noun()}`,
    description: possibly(() => faker.lorem.paragraph(), 0.85),
    depth: possibly(fakeDepth, 0.7),

    location: `${faker.address.city()}, ${faker.address.stateAbbr()}, ${faker.address.countryCode()}`,
    directions: possibly(() => faker.lorem.sentences(3), 0.62),
    gps: possibly(
      () => ({
        type: 'Point',
        coordinates: [
          parseFloat(faker.address.longitude()),
          parseFloat(faker.address.latitude()),
        ],
      }),
      0.75,
    ),

    freeToDive: possibly(() => faker.datatype.boolean(), 0.9),
    shoreAccess: possibly(() => faker.datatype.boolean(), 0.8),

    averageRating: faker.datatype.number({ min: 1, max: 5, precision: 0.1 }),
    averageDifficulty: faker.datatype.number({
      min: 1,
      max: 5,
      precision: 0.1,
    }),
  });
}
