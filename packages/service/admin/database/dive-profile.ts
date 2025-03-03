/* eslint-disable no-console */
import { GpsCoordinates } from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import {
  Observable,
  bufferCount,
  lastValueFrom,
  map,
  mergeMap,
  range,
} from 'rxjs';
import { DataSource } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { LogEntryEntity, LogEntrySampleEntity } from '../../src/data';
import { getDataSource } from './data-source';

type DiveProfileOptions = {
  /** Time taken to descend to depth (seconds) */
  descentTime?: number;

  /** Total dive duration (seconds) */
  duration?: number;

  /** Temperature above thermocline */
  highTemp?: number;

  /** Temperature below thermocline */
  lowTemp?: number;

  /** Maximum depth of dive profile */
  maxDepth?: number;

  /** Depth of the thermocline */
  thermocline?: number;

  /** Duration spent at (or near) the bottom (seconds) */
  timeAtDepth?: number;
};

function createTestDiveProfile(
  logEntryId: string,
  options: DiveProfileOptions = {},
): Observable<LogEntrySampleEntity> {
  options.duration ??= faker.number.int({ min: 1200, max: 4200 }); // 20-70 minutes (in seconds)
  options.thermocline ??= faker.number.float({
    min: 15.24,
    max: 19.81,
    fractionDigits: 2,
  });
  options.highTemp ??= faker.number.float({
    min: 18.0,
    max: 22.0,
    fractionDigits: 1,
  });
  options.lowTemp ??= faker.number.float({
    min: 10.0,
    max: 15.0,
    fractionDigits: 1,
  });
  options.descentTime ??= faker.number.float({
    min: 30,
    max: 120,
    fractionDigits: 2,
  }); // 30-120 seconds
  options.maxDepth ??= faker.number.float({
    min: 7.0,
    max: 40.0,
    fractionDigits: 2,
  });
  options.timeAtDepth ??= faker.number.float({
    min: 0.1,
    max: 0.7,
    fractionDigits: 3,
  });
  const ascentTime =
    options.duration - options.descentTime - options.timeAtDepth;
  const startingPosition: GpsCoordinates = {
    lat: 20.480903,
    lon: -86.993041,
  };
  const directonVector: GpsCoordinates = {
    lat: 0.00001,
    lon: 0.00001,
  };

  return range(0, options.duration).pipe(
    map((offset) => {
      let depth: number = 0;

      if (offset < options.descentTime!) {
        depth = (offset / options.descentTime!) * options.maxDepth!;
      } else if (offset < options.descentTime! + options.timeAtDepth!) {
        depth =
          options.maxDepth! -
          faker.number.float({ min: 0.1, max: 1.5, fractionDigits: 2 });
      } else {
        depth =
          options.maxDepth! -
          ((offset - options.descentTime! - options.timeAtDepth!) /
            ascentTime) *
            options.maxDepth!;
      }

      return {
        id: uuid(),
        depth,
        temperature:
          depth > options.thermocline! ? options.lowTemp! : options.highTemp!,
        logEntry: { id: logEntryId } as LogEntryEntity,
        timeOffset: offset * 1000,
        gps: {
          type: 'Point',
          coordinates: [
            startingPosition.lon + (directonVector.lon * offset) / 100,
            startingPosition.lat + (directonVector.lat * offset) / 100,
          ],
        },
      };
    }),
  );
}

export async function generateDiveProfile(
  postgresUri: string,
  requireSsl: boolean,
  entryId: string,
): Promise<void> {
  let ds: DataSource | undefined;

  try {
    ds = await getDataSource(postgresUri, requireSsl);

    const samples = ds.getRepository(LogEntrySampleEntity);

    console.log('Generating dive profile...');
    await samples.delete({ logEntry: { id: entryId } });
    await lastValueFrom(
      createTestDiveProfile(entryId).pipe(
        bufferCount(50),
        mergeMap(async (batch) => {
          console.log(
            `Adding ${batch.length} samples to log entry with ID "${entryId}"...`,
          );

          await samples.save(batch);
        }),
      ),
    );
    console.log('Done saving dive profile!');
  } catch (error) {
    console.error('Error generating dive profile:', error);
    process.exitCode = 1;
  } finally {
    console.debug('Closing!');
    if (ds) await ds.destroy();
  }
}
