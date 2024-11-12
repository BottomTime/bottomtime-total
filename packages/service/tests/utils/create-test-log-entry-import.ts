import { faker } from '@faker-js/faker';

import { LogEntryImportEntity, UserEntity } from '../../src/data';

const DiveComputers = [
  'Mares Puck Pro Plus',
  'Cressi Neon',
  'Aqua Lung i300C',
  'Oceanic Geo 4.0',
  'Garmin Descent Mk2',
  'Suunto D5',
  'Shearwater Perdix 2 Ti',
  'Shearwater Teric',
  'Scubapro G2',
];

export function createTestLogEntryImport(
  owner: UserEntity,
  options?: Partial<LogEntryImportEntity>,
): LogEntryImportEntity {
  const date = options?.date ?? faker.date.recent({ days: 180 });
  const data: LogEntryImportEntity = {
    id: options?.id || faker.string.uuid(),
    owner,
    date,
    device: options?.device ?? faker.helpers.arrayElement(DiveComputers),
    deviceId: options?.deviceId ?? faker.commerce.isbn(),
    bookmark: options?.bookmark ?? faker.string.alphanumeric(10),
    finalized:
      options?.finalized ??
      faker.helpers.maybe(
        () =>
          new Date(date.valueOf() + faker.number.int({ min: 200, max: 20000 })),
        { probability: 0.85 },
      ) ??
      null,
  };

  return data;
}
