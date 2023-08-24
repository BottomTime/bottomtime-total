import { DiveSiteData } from '@/client/diveSites';
import { DepthUnit } from '@/constants';
import { faker } from '@faker-js/faker';

export function fakeDiveSite(): DiveSiteData {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  return {
    id: faker.datatype.uuid(),
    createdOn: faker.date.past(3),
    updatedOn: faker.date.recent(90),
    creator: {
      avatar: faker.internet.avatar(),
      id: faker.datatype.uuid(),
      username: faker.internet.userName(firstName, lastName),
      displayName: `${firstName} ${lastName}`,
      memberSince: faker.date.past(8),
    },
    averageRating: faker.datatype.float({ min: 1.0, max: 5.0 }),
    averageDifficulty: faker.datatype.float({ min: 1.0, max: 5.0 }),
    name: faker.music.songName(),
    description: faker.lorem.paragraphs(2),
    depth: {
      unit: DepthUnit.Meters,
      depth: faker.datatype.float({ min: 4.0, max: 40.0 }),
    },
    location: faker.address.city(),
    gps: {
      lat: faker.datatype.float({ min: -90, max: 90 }),
      lon: faker.datatype.float({ min: -180, max: 180 }),
    },
    freeToDive: faker.helpers.maybe(() => faker.datatype.boolean(), {
      probability: 0.75,
    }),
    shoreAccess: faker.helpers.maybe(() => faker.datatype.boolean(), {
      probability: 0.75,
    }),
  };
}
