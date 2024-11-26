import { GpsCoordinates } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import { Observable, map, range } from 'rxjs';
import { v7 as uuid } from 'uuid';

import { LogEntryEntity, LogEntrySampleEntity } from '../../src/data';

export function createTestDiveProfile(
  logEntryId: string,
): Observable<LogEntrySampleEntity> {
  const duration = faker.number.int({ min: 1200, max: 4200 }); // 20-70 minutes (in seconds)
  const thermocline = faker.number.float({
    min: 15.24,
    max: 19.81,
    fractionDigits: 2,
  });
  const highTemp = faker.number.float({
    min: 18.0,
    max: 22.0,
    fractionDigits: 1,
  });
  const lowTemp = faker.number.float({
    min: 10.0,
    max: 15.0,
    fractionDigits: 1,
  });
  const descentTime = faker.number.float({
    min: 30,
    max: 120,
    fractionDigits: 2,
  }); // 30-120 seconds
  const maxDepth = faker.number.float({
    min: 7.0,
    max: 40.0,
    fractionDigits: 2,
  });
  const timeAtDepth =
    duration *
    faker.number.float({
      min: 0.1,
      max: 0.7,
      fractionDigits: 3,
    });
  const ascentTime = duration - descentTime - timeAtDepth;
  const startingPosition: GpsCoordinates = {
    lat: 20.480903,
    lon: -86.993041,
  };
  const directonVector: GpsCoordinates = {
    lat: 0.000001,
    lon: 0.000001,
  };

  return range(0, duration).pipe(
    map((offset) => {
      let depth: number = 0;

      if (offset < descentTime) {
        depth = (offset / descentTime) * maxDepth;
      } else if (offset < descentTime + timeAtDepth) {
        depth =
          maxDepth -
          faker.number.float({ min: 0.1, max: 1.5, fractionDigits: 2 });
      } else {
        depth =
          maxDepth -
          ((offset - descentTime - timeAtDepth) / ascentTime) * maxDepth;
      }

      return {
        id: uuid(),
        depth,
        temperature: depth > thermocline ? lowTemp : highTemp,
        logEntry: { id: logEntryId } as LogEntryEntity,
        timeOffset: offset * 1000,
        gps: {
          type: 'Point',
          coordinates: [
            startingPosition.lon + directonVector.lon * duration,
            startingPosition.lat + directonVector.lat * duration,
          ],
        },
      };
    }),
  );
}
