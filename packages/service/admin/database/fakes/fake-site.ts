import { faker } from '@faker-js/faker';

import { DiveSiteEntity, UserEntity } from '../../../src/data';
import { fakeDepth } from './fake-depth';
import { possibly } from './possibly';

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
    multipleOf: 0.1,
  });
  data.averageDifficulty = faker.number.float({
    min: 1,
    max: 5,
    multipleOf: 0.1,
  });

  return data;
}
