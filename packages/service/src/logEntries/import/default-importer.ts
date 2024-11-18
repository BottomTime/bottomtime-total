import { CreateOrUpdateLogEntryParamsSchema } from '@bottomtime/api';

import { Inject, Injectable, Logger } from '@nestjs/common';

import dayjs from 'dayjs';
import { Observable, map } from 'rxjs';
import { v7 as uuid } from 'uuid';

import { DiveSiteEntity, LogEntryEntity } from '../../data';
import { LogEntryFactory } from '../log-entry-factory';
import { IImporter, ImportOptions } from './importer';

@Injectable()
export class DefaultImporter implements IImporter {
  private readonly log = new Logger(DefaultImporter.name);

  constructor(
    @Inject(LogEntryFactory) private readonly entryFactory: LogEntryFactory,
  ) {}

  private parseData(options: ImportOptions, raw: string): LogEntryEntity {
    this.log.verbose('Parsing raw log entry data', raw);
    const json = JSON.parse(raw);
    const parsed = CreateOrUpdateLogEntryParamsSchema.parse(json);

    const now = new Date();
    const entryTime = dayjs(parsed.timing.entryTime.date);
    const entry: LogEntryEntity = {
      airTemperature: parsed.conditions?.airTemperature ?? null,
      averageDepth: parsed.depths?.averageDepth ?? null,
      boots: parsed.equipment?.boots ?? null,
      bottomTemperature: parsed.conditions?.bottomTemperature ?? null,
      bottomTime: parsed.timing.bottomTime ?? null,
      camera: parsed.equipment?.camera ?? null,
      chop: parsed.conditions?.chop ?? null,
      createdAt: now,
      current: parsed.conditions?.current ?? null,
      depthUnit: parsed.depths?.depthUnit ?? null,
      deviceId: options.deviceId ?? null,
      deviceName: options.device ?? null,
      duration: parsed.timing.duration,
      entryTime: entryTime.format('YYYY-MM-DDTHH:mm:ss'),
      exposureSuit: parsed.equipment?.exposureSuit ?? null,
      gloves: parsed.equipment?.gloves ?? null,
      hood: parsed.equipment?.hood ?? null,
      id: uuid(),
      logNumber: parsed.logNumber ?? null,
      maxDepth: parsed.depths?.maxDepth ?? null,
      notes: parsed.notes ?? null,
      owner: options.owner.toEntity(),
      scooter: parsed.equipment?.scooter ?? null,
      site: null, // TODO
      surfaceTemperature: parsed.conditions?.surfaceTemperature ?? null,
      tags: parsed.tags ?? [],
      temperatureUnit: parsed.conditions?.temperatureUnit ?? null,
      timestamp: entryTime
        .tz(parsed.timing.entryTime.timezone, true)
        .utc()
        .toDate(),
      torch: parsed.equipment?.torch ?? null,
      timezone: parsed.timing.entryTime.timezone,
      trimCorrectness: parsed.equipment?.trimCorrectness ?? null,
      updatedAt: null,
      visibility: parsed.conditions?.visibility ?? null,
      weather: parsed.conditions?.weather ?? null,
      weight: parsed.equipment?.weight ?? null,
      weightCorrectness: parsed.equipment?.weightCorrectness ?? null,
      weightUnit: parsed.equipment?.weightUnit ?? null,
    };

    if (parsed.air) {
      entry.air = parsed.air.map((tank, index) => ({
        count: tank.count,
        endPressure: tank.endPressure,
        hePercent: tank.hePercent ?? null,
        id: uuid(),
        material: tank.material,
        name: tank.name,
        o2Percent: tank.o2Percent ?? null,
        ordinal: index + 1,
        pressureUnit: tank.pressureUnit,
        startPressure: tank.startPressure,
        volume: tank.volume,
        workingPressure: tank.workingPressure,
      }));
    }

    if (parsed.site) {
      entry.site = { id: parsed.site } as DiveSiteEntity;
    }

    return entry;
  }

  import(options: ImportOptions): Observable<LogEntryEntity> {
    return options.data.pipe(
      // Parse raw JSON data.
      map((data) => this.parseData(options, data)),
    );
  }
}
