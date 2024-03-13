import { DepthDTO, DepthUnit } from '@bottomtime/api';

import { DiveSiteEntity, UserEntity } from '@/data';
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

export function fakeDiveSite(userIds: string[]): DiveSiteEntity {
  const data = new DiveSiteEntity();
  const depth = possibly(fakeDepth, 0.7);

  data.id = faker.datatype.uuid();
  data.creator = { id: faker.helpers.arrayElement(userIds) } as UserEntity;
  data.createdOn = faker.date.past(5);
  data.updatedOn = possibly(() => faker.date.past(2), 0.5) ?? null;

  data.name = `${faker.word.adjective()}, ${faker.word.adjective()} ${faker.word.noun()}`;
  data.description = possibly(() => faker.lorem.paragraph(), 0.85) ?? null;
  data.depth = depth?.depth ?? null;
  data.depthUnit = depth?.unit ?? null;

  data.location = `${faker.address.city()}, ${faker.address.stateAbbr()}, ${faker.address.countryCode()}`;
  data.directions = possibly(() => faker.lorem.sentences(3), 0.62) ?? null;
  data.gps =
    possibly(
      () => ({
        type: 'Point',
        coordinates: [
          parseFloat(faker.address.longitude()),
          parseFloat(faker.address.latitude()),
        ],
      }),
      0.75,
    ) ?? null;

  data.freeToDive = possibly(() => faker.datatype.boolean(), 0.9) ?? null;
  data.shoreAccess = possibly(() => faker.datatype.boolean(), 0.8) ?? null;

  data.averageRating = faker.datatype.number({
    min: 1,
    max: 5,
    precision: 0.1,
  });
  data.averageDifficulty = faker.datatype.number({
    min: 1,
    max: 5,
    precision: 0.1,
  });

  return data;
}
