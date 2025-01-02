import {
  CreateOrUpdateLogEntryParamsDTO,
  LogEntrySampleDTO,
} from '@bottomtime/api';

import { faker } from '@faker-js/faker';

import { lastValueFrom, map, toArray } from 'rxjs';

import {
  LogEntryImportEntity,
  LogEntryImportRecordEntity,
  UserEntity,
} from '../../src/data';
import { createTestDiveProfile } from './create-test-dive-profile';
import { createTestLogEntry } from './create-test-log-entry';

async function createRecordData(
  owner: UserEntity,
): Promise<CreateOrUpdateLogEntryParamsDTO> {
  const data = createTestLogEntry(owner);
  return {
    timing: {
      duration: data.duration,
      entryTime: data.entryTime.valueOf(),
      timezone: data.timezone,
      bottomTime: data.bottomTime ?? undefined,
    },
    air: data.air?.map((air) => ({
      count: air.count,
      endPressure: air.endPressure,
      hePercent: air.hePercent ?? undefined,
      o2Percent: air.o2Percent ?? undefined,
      material: air.material,
      name: air.name,
      pressureUnit: air.pressureUnit,
      startPressure: air.startPressure,
      volume: air.volume,
      workingPressure: air.workingPressure,
    })),
    conditions: {
      airTemperature: data.airTemperature ?? undefined,
      bottomTemperature: data.bottomTemperature ?? undefined,
      chop: data.chop ?? undefined,
      current: data.current ?? undefined,
      surfaceTemperature: data.surfaceTemperature ?? undefined,
      temperatureUnit: data.temperatureUnit ?? undefined,
      visibility: data.visibility ?? undefined,
      weather: data.weather ?? undefined,
    },
    depths: {
      averageDepth: data.averageDepth ?? undefined,
      maxDepth: data.maxDepth ?? undefined,
      depthUnit: data.depthUnit ?? undefined,
    },
    equipment: {
      boots: data.boots ?? undefined,
      camera: data.camera ?? undefined,
      exposureSuit: data.exposureSuit ?? undefined,
      gloves: data.gloves ?? undefined,
      hood: data.hood ?? undefined,
      scooter: data.scooter ?? undefined,
      torch: data.torch ?? undefined,
      trimCorrectness: data.trimCorrectness ?? undefined,
      weight: data.weight ?? undefined,
      weightCorrectness: data.weightCorrectness ?? undefined,
      weightUnit: data.weightUnit ?? undefined,
    },
    logNumber: data.logNumber ?? undefined,
    notes: data.notes ?? undefined,
    samples: await lastValueFrom(
      createTestDiveProfile('', {
        duration: faker.number.int({ min: 300, max: 900 }),
      }).pipe(
        map(
          (entity): LogEntrySampleDTO => ({
            depth: entity.depth ?? 0,
            offset: entity.timeOffset,
            gps: entity.gps
              ? {
                  lat: entity.gps.coordinates[1],
                  lng: entity.gps.coordinates[0],
                }
              : undefined,
            temperature: entity.temperature ?? undefined,
          }),
        ),
        toArray(),
      ),
    ),
    tags: data.tags ?? undefined,
  };
}

export async function createTestLogEntryImportRecord(
  owner: UserEntity,
  options?: Partial<Omit<LogEntryImportRecordEntity, 'data'>>,
): Promise<LogEntryImportRecordEntity> {
  return {
    id: options?.id || faker.string.uuid(),
    import:
      options?.import ?? ({ id: faker.string.uuid() } as LogEntryImportEntity),
    timestamp: options?.timestamp ?? faker.date.past({ years: 3 }),
    data: JSON.stringify(await createRecordData(owner)),
  };
}
