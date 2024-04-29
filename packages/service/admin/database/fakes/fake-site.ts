import { DepthDTO, DepthUnit } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import { DiveSiteEntity, UserEntity } from '../../../src/data';
import { possibly } from './possibly';

export function fakeDepth(): DepthDTO {
  const unit = faker.helpers.arrayElement([DepthUnit.Feet, DepthUnit.Meters]);
  const depth =
    unit === DepthUnit.Feet
      ? faker.number.float({ min: 20, max: 145, precision: 0.1 })
      : faker.number.float({ min: 6, max: 44, precision: 0.01 });

  return { depth, unit };
}

export function fakeDiveSite(userIds: string[]): DiveSiteEntity {
  const data = new DiveSiteEntity();
  const depth = possibly(fakeDepth, 0.7);

  data.id = faker.string.uuid();
  data.creator = { id: faker.helpers.arrayElement(userIds) } as UserEntity;
  data.createdOn = faker.date.past({ years: 5 });
  data.updatedOn = possibly(() => faker.date.past({ years: 2 }), 0.5) ?? null;

  data.name = `${faker.word.adjective()}, ${faker.word.adjective()} ${faker.word.noun()}`;
  data.description = possibly(() => faker.lorem.paragraph(), 0.85) ?? null;
  data.depth = depth?.depth ?? null;
  data.depthUnit = depth?.unit ?? null;

  data.location = `${faker.location.city()}, ${faker.location.state({
    abbreviated: true,
  })}, ${faker.location.countryCode()}`;
  data.directions = possibly(() => faker.lorem.sentences(3), 0.62) ?? null;
  data.gps =
    possibly(
      () => ({
        type: 'Point',
        coordinates: [faker.location.longitude(), faker.location.latitude()],
      }),
      0.75,
    ) ?? null;

  data.freeToDive = possibly(() => faker.datatype.boolean(), 0.9) ?? null;
  data.shoreAccess = possibly(() => faker.datatype.boolean(), 0.8) ?? null;

  data.averageRating = faker.number.float({
    min: 1,
    max: 5,
    precision: 0.1,
  });
  data.averageDifficulty = faker.number.float({
    min: 1,
    max: 5,
    precision: 0.1,
  });

  return data;
}
