import { faker } from '@faker-js/faker';

import { DiveOperatorEntity, UserEntity } from '../../../src/data';

export function fakeDiveOperator(userIds: string[]): DiveOperatorEntity {
  const operator: DiveOperatorEntity = {
    id: faker.string.uuid(),
    createdAt: faker.date.past({ years: 5 }),
    updatedAt: faker.date.recent({ days: 180 }),
    owner: { id: faker.helpers.arrayElement(userIds) } as UserEntity,

    name: faker.company.name(),
    description: faker.lorem.paragraphs(2),

    address: `${faker.location.streetAddress({
      useFullAddress: true,
    })}, ${faker.location.city()}, ${faker.location.state({
      abbreviated: true,
    })}, ${faker.location.zipCode()}`,
    phone: faker.phone.number(),
    email: faker.internet.email(),
    website: faker.internet.url(),

    gps: {
      type: 'Point',
      coordinates: [faker.location.longitude(), faker.location.latitude()],
    },

    facebook: faker.internet.userName(),
    instagram: faker.internet.userName(),
    tiktok: faker.internet.userName(),
    twitter: faker.internet.userName(),

    logo: faker.image.url({ width: 128, height: 128 }),
    banner: faker.image.url({ width: 1024, height: 256 }),
  };

  return operator;
}
