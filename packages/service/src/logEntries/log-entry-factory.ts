import { CreateOrUpdateLogEntryParamsDTO } from '@bottomtime/api';

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  DiveSiteEntity,
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
} from '../data';
import { DiveSiteFactory } from '../diveSites';
import { OperatorFactory } from '../operators';
import { User } from '../users';
import { LogEntry } from './log-entry';

@Injectable()
export class LogEntryFactory {
  constructor(
    @InjectRepository(LogEntryEntity)
    private readonly Entries: Repository<LogEntryEntity>,

    @InjectRepository(LogEntryAirEntity)
    private readonly EntryAir: Repository<LogEntryAirEntity>,

    @InjectRepository(LogEntrySampleEntity)
    private readonly EntrySamples: Repository<LogEntrySampleEntity>,

    @Inject(DiveSiteFactory)
    private readonly siteFactory: DiveSiteFactory,

    @Inject(OperatorFactory)
    private readonly operatorFactory: OperatorFactory,
  ) {}

  createLogEntry(data: LogEntryEntity): LogEntry {
    return new LogEntry(
      this.Entries,
      this.EntryAir,
      this.EntrySamples,
      this.siteFactory,
      this.operatorFactory,
      data,
    );
  }

  createLogEntryFromCreateDTO(
    owner: User,
    data: CreateOrUpdateLogEntryParamsDTO,
  ): LogEntry {
    const now = new Date();
    const entry: LogEntryEntity = {
      airTemperature: data.conditions?.airTemperature ?? null,
      averageDepth: data.depths?.averageDepth ?? null,
      boots: data.equipment?.boots ?? null,
      bottomTemperature: data.conditions?.bottomTemperature ?? null,
      bottomTime: data.timing.bottomTime ?? null,
      camera: data.equipment?.camera ?? null,
      chop: data.conditions?.chop ?? null,
      createdAt: now,
      current: data.conditions?.current ?? null,
      depthUnit: data.depths?.depthUnit ?? null,
      deviceId: null,
      deviceName: null,
      duration: data.timing.duration,
      exposureSuit: data.equipment?.exposureSuit ?? null,
      gloves: data.equipment?.gloves ?? null,
      hood: data.equipment?.hood ?? null,
      id: uuid(),
      logNumber: data.logNumber ?? null,
      maxDepth: data.depths?.maxDepth ?? null,
      notes: data.notes ?? null,
      operator: null,
      owner: owner.toEntity(),
      rating: data.rating ?? null,
      scooter: data.equipment?.scooter ?? null,
      site: data.site ? ({ id: data.site } as DiveSiteEntity) : null,
      surfaceTemperature: data.conditions?.surfaceTemperature ?? null,
      tags: data.tags ?? [],
      temperatureUnit: data.conditions?.temperatureUnit ?? null,
      entryTime: new Date(data.timing.entryTime),
      torch: data.equipment?.torch ?? null,
      timezone: data.timing.timezone,
      trimCorrectness: data.equipment?.trimCorrectness ?? null,
      updatedAt: null,
      visibility: data.conditions?.visibility ?? null,
      weather: data.conditions?.weather ?? null,
      weight: data.equipment?.weight ?? null,
      weightCorrectness: data.equipment?.weightCorrectness ?? null,
      weightUnit: data.equipment?.weightUnit ?? null,
    };

    if (data.air) {
      entry.air = data.air.map((tank, index) => ({
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
        logEntry: { id: entry.id } as LogEntryEntity,
      }));
    }

    if (data.samples) {
      entry.samples = data.samples.map((sample) => ({
        depth: sample.depth ?? null,
        gps: sample.gps
          ? {
              coordinates: [sample.gps.lng, sample.gps.lat],
              type: 'Point',
            }
          : null,
        id: uuid(),
        logEntry: { id: entry.id } as LogEntryEntity,
        temperature: sample.temperature ?? null,
        timeOffset: sample.offset,
      }));
    }

    return new LogEntry(
      this.Entries,
      this.EntryAir,
      this.EntrySamples,
      this.siteFactory,
      this.operatorFactory,
      entry,
    );
  }
}
