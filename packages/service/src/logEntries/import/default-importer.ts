import {
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
} from '@bottomtime/api';

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import dayjs from 'dayjs';
import { Observable, bufferCount, map } from 'rxjs';
import { LogEntryEntity } from 'src/data';
import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { User } from '../../users';
import { LogEntry } from '../log-entry';
import { LogEntryFactory } from '../log-entry-factory';
import { IImporter, ImportOptions } from './importer';

@Injectable()
export class DefaultImporter implements IImporter {
  constructor(
    @InjectRepository(LogEntryEntity)
    private readonly entries: Repository<LogEntryEntity>,

    @Inject(LogEntryFactory) private readonly entryFactory: LogEntryFactory,
  ) {}

  private parseData(owner: User, raw: unknown): LogEntryEntity {
    const parsed = CreateOrUpdateLogEntryParamsSchema.parse(raw);
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
      duration: parsed.timing.duration,
      entryTime: entryTime.format('YYYY-MM-DDTHH:mm:ss'),
      exposureSuit: parsed.equipment?.exposureSuit ?? null,
      gloves: parsed.equipment?.gloves ?? null,
      hood: parsed.equipment?.hood ?? null,
      id: uuid(),
      logNumber: parsed.logNumber ?? null,
      maxDepth: parsed.depths?.maxDepth ?? null,
      notes: parsed.notes ?? null,
      owner: owner.toEntity(),
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

    // TODO: Air, other stuff.

    return entry;
  }

  import(options: ImportOptions): Observable<LogEntry> {
    return new Observable<LogEntry>((subscriber) => {
      options.data
        .pipe(
          map((data) => this.parseData(options.owner, data)),
          bufferCount(20),
        )
        .subscribe((batch: LogEntryEntity[]) => {
          this.entries
            .save(batch)
            .then(() => {
              batch.forEach((data) => {
                subscriber.next(this.entryFactory.createLogEntry(data));
              });
            })
            .catch(subscriber.error);
        });
    });
  }
}
