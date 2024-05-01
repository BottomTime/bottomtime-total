import { DepthDTO, DepthUnit } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

export function fakeDepth(): DepthDTO {
  const unit = faker.helpers.arrayElement([DepthUnit.Feet, DepthUnit.Meters]);
  const depth =
    unit === DepthUnit.Feet
      ? faker.number.float({ min: 20, max: 145, multipleOf: 0.1 })
      : faker.number.float({ min: 6, max: 44, multipleOf: 0.01 });

  return { depth, unit };
}
