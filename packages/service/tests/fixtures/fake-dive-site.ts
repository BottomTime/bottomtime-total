import { faker } from '@faker-js/faker';
import { DiveSiteDocument } from '../../src/data';
import { Depth } from '../../src/common';
import { DepthUnit } from '../../src/constants';

const DepthUnits = Object.values(DepthUnit);

function randomDepth(): Depth {
  const unit = faker.helpers.arrayElement(DepthUnits);
  return {
    depth:
      unit === 'm'
        ? faker.datatype.float({ min: 3, max: 40, precision: 0.01 })
        : faker.datatype.float({ min: 7, max: 130, precision: 0.1 }),
    unit,
  };
}

export function fakeDiveSite(
  data?: Partial<DiveSiteDocument>,
): DiveSiteDocument {
  return {
    _id: data?._id ?? faker.datatype.uuid(),
    creator: data?.creator ?? faker.datatype.uuid(),
    createdOn: data?.createdOn ?? faker.date.past(6),
    updatedOn: data?.updatedOn ?? faker.date.past(3),
    name: data?.name ?? `${faker.word.adjective()} ${faker.word.noun()}`,
    description: data?.description ?? faker.lorem.sentences(2),
    location:
      data?.location ??
      `${faker.address.cityName()} ${faker.address.country()}`,
    directions: data?.directions ?? faker.lorem.sentence(),
    depth: data?.depth ?? randomDepth(),
    gps: data?.gps ?? {
      type: 'Point',
      coordinates: [
        faker.datatype.float({ min: -180, max: 180 }),
        faker.datatype.float({ min: -90, max: 90 }),
      ],
    },
    freeToDive: data?.freeToDive ?? faker.datatype.boolean(),
    shoreAccess: data?.shoreAccess ?? faker.datatype.boolean(),
    averageRating:
      data?.averageRating ?? faker.datatype.float({ min: 1, max: 5 }),
    averageDifficulty:
      data?.averageDifficulty ?? faker.datatype.float({ min: 1, max: 5 }),
  };
}
