import { PressureUnit, TankMaterial } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import { LogEntryAirEntity } from '../../src/data';

export function createTestlogEntryAir(): LogEntryAirEntity {
  const data = new LogEntryAirEntity();

  data.id = faker.string.uuid();
  data.name = faker.lorem.words(3);
  data.material = faker.helpers.arrayElement(Object.values(TankMaterial));
  data.workingPressure = faker.number.float({
    min: 2000,
    max: 3500,
    multipleOf: 100,
  });
  data.volume = faker.number.float({ min: 8, max: 15, multipleOf: 0.5 });
  data.count = faker.number.int({ min: 1, max: 3 });
  data.startPressure = faker.number.float({
    min: 1000,
    max: 2000,
    multipleOf: 100,
  });
  data.endPressure = faker.number.float({
    min: 500,
    max: 1500,
    multipleOf: 100,
  });
  data.pressureUnit = faker.helpers.arrayElement(Object.values(PressureUnit));
  data.o2Percent =
    faker.helpers.maybe(() => faker.number.float({ min: 21, max: 40 }), {
      probability: 0.5,
    }) ?? null;
  data.hePercent =
    faker.helpers.maybe(() => faker.number.float({ min: 0, max: 100 }), {
      probability: 0.1,
    }) ?? null;

  return data;
}
