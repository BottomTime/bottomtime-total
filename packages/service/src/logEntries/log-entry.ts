import {
  DateWithTimezoneDTO,
  DepthUnit,
  ExposureSuit,
  LogEntryAirDTO,
  LogEntryConditionsDTO,
  LogEntryDTO,
  LogEntryDepthsDTO,
  LogEntryEquipmentDTO,
  LogEntryTimingDTO,
  SuccinctLogEntryDTO,
  SuccinctProfileDTO,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import { Logger } from '@nestjs/common';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import 'dayjs/plugin/utc';
import { Repository } from 'typeorm';

import { LogEntryAirEntity, LogEntryEntity } from '../data';
import { DiveSite, DiveSiteFactory } from '../diveSites';
import { LogEntryAirUtils } from './log-entry-air-utils';

const DateTimeFormat = 'YYYY-MM-DDTHH:mm:ss';

class EntryConditions {
  constructor(private readonly data: LogEntryEntity) {}

  get airTemperature(): number | undefined {
    return this.data.airTemperature ?? undefined;
  }
  set airTemperature(value: number | undefined) {
    this.data.airTemperature = value ?? null;
  }

  get surfaceTemperature(): number | undefined {
    return this.data.surfaceTemperature ?? undefined;
  }
  set surfaceTemperature(value: number | undefined) {
    this.data.surfaceTemperature = value ?? null;
  }

  get bottomTemperature(): number | undefined {
    return this.data.bottomTemperature ?? undefined;
  }
  set bottomTemperature(value: number | undefined) {
    this.data.bottomTemperature = value ?? null;
  }

  get temperatureUnit(): TemperatureUnit {
    return this.data.temperatureUnit ?? TemperatureUnit.Celsius;
  }
  set temperatureUnit(value: TemperatureUnit) {
    this.data.temperatureUnit = value;
  }

  get chop(): number | undefined {
    return this.data.chop ?? undefined;
  }
  set chop(value: number | undefined) {
    this.data.chop = value ?? null;
  }

  get current(): number | undefined {
    return this.data.current ?? undefined;
  }
  set current(value: number | undefined) {
    this.data.current = value ?? null;
  }

  get weather(): string | undefined {
    return this.data.weather ?? undefined;
  }
  set weather(value: string | undefined) {
    this.data.weather = value ?? null;
  }

  get visibility(): number | undefined {
    return this.data.visibility ?? undefined;
  }
  set visibility(value: number | undefined) {
    this.data.visibility = value ?? null;
  }

  toJSON(): LogEntryConditionsDTO {
    return {
      airTemperature: this.airTemperature,
      surfaceTemperature: this.surfaceTemperature,
      bottomTemperature: this.bottomTemperature,
      temperatureUnit: this.temperatureUnit,
      chop: this.chop,
      current: this.current,
      weather: this.weather,
      visibility: this.visibility,
    };
  }
}

class EntryDepths {
  constructor(private readonly data: LogEntryEntity) {}

  get averageDepth(): number | undefined {
    return this.data.averageDepth ?? undefined;
  }
  set averageDepth(value: number | undefined) {
    this.data.averageDepth = value ?? null;
  }

  get maxDepth(): number | undefined {
    return this.data.maxDepth ?? undefined;
  }
  set maxDepth(value: number | undefined) {
    this.data.maxDepth = value ?? null;
  }

  get depthUnit(): DepthUnit {
    return this.data.depthUnit ?? DepthUnit.Meters;
  }
  set depthUnit(value: DepthUnit) {
    this.data.depthUnit = value;
  }

  toJSON(): LogEntryDepthsDTO {
    return {
      averageDepth: this.averageDepth,
      maxDepth: this.maxDepth,
      depthUnit: this.depthUnit,
    };
  }
}

class EntryEquipment {
  constructor(private readonly data: LogEntryEntity) {}

  get weight(): number | undefined {
    return this.data.weight ?? undefined;
  }
  set weight(value: number | undefined) {
    this.data.weight = value ?? null;
  }

  get weightUnit(): WeightUnit {
    return this.data.weightUnit ?? WeightUnit.Kilograms;
  }
  set weightUnit(value: WeightUnit) {
    this.data.weightUnit = value;
  }

  get weightCorrectness(): WeightCorrectness | undefined {
    return this.data.weightCorrectness ?? undefined;
  }
  set weightCorrectness(value: WeightCorrectness | undefined) {
    this.data.weightCorrectness = value ?? null;
  }

  get trimCorrectness(): TrimCorrectness | undefined {
    return this.data.trimCorrectness ?? undefined;
  }
  set trimCorrectness(value: TrimCorrectness | undefined) {
    this.data.trimCorrectness = value ?? null;
  }

  get exposureSuit(): ExposureSuit | undefined {
    return this.data.exposureSuit ?? undefined;
  }
  set exposureSuit(value: ExposureSuit | undefined) {
    this.data.exposureSuit = value ?? null;
  }

  get hood(): boolean | undefined {
    return this.data.hood ?? undefined;
  }
  set hood(value: boolean | undefined) {
    this.data.hood = value ?? null;
  }

  get gloves(): boolean | undefined {
    return this.data.gloves ?? undefined;
  }
  set gloves(value: boolean | undefined) {
    this.data.gloves = value ?? null;
  }

  get boots(): boolean | undefined {
    return this.data.boots ?? undefined;
  }
  set boots(value: boolean | undefined) {
    this.data.boots = value ?? null;
  }

  get camera(): boolean | undefined {
    return this.data.camera ?? undefined;
  }
  set camera(value: boolean | undefined) {
    this.data.camera = value ?? null;
  }

  get torch(): boolean | undefined {
    return this.data.torch ?? undefined;
  }
  set torch(value: boolean | undefined) {
    this.data.torch = value ?? null;
  }

  get scooter(): boolean | undefined {
    return this.data.scooter ?? undefined;
  }
  set scooter(value: boolean | undefined) {
    this.data.scooter = value ?? null;
  }

  toJSON(): LogEntryEquipmentDTO {
    return {
      weight: this.weight,
      weightUnit: this.weightUnit,
      weightCorrectness: this.weightCorrectness,
      trimCorrectness: this.trimCorrectness,
      exposureSuit: this.exposureSuit,
      hood: this.hood,
      gloves: this.gloves,
      boots: this.boots,
      camera: this.camera,
      torch: this.torch,
      scooter: this.scooter,
    };
  }
}

class EntryTiming {
  constructor(private readonly data: LogEntryEntity) {}

  get entryTime(): DateWithTimezoneDTO {
    return {
      date: dayjs(this.data.entryTime).format(DateTimeFormat),
      timezone: this.data.timezone,
    };
  }
  set entryTime(value: DateWithTimezoneDTO) {
    const entryTime = dayjs(value.date);
    this.data.timestamp = entryTime.tz(value.timezone, true).utc().toDate();
    this.data.entryTime = entryTime.format(DateTimeFormat);
    this.data.timezone = value.timezone;
  }

  get timestamp(): Date {
    return this.data.timestamp;
  }

  get duration(): number {
    return this.data.duration;
  }
  set duration(value: number) {
    this.data.duration = value;
  }

  get bottomTime(): number | undefined {
    return this.data.bottomTime ?? undefined;
  }
  set bottomTime(value: number | undefined) {
    this.data.bottomTime = value ?? null;
  }

  toJSON(): LogEntryTimingDTO {
    return {
      entryTime: this.entryTime,
      duration: this.duration,
      bottomTime: this.bottomTime,
    };
  }
}

export class LogEntry {
  private readonly log = new Logger(LogEntry.name);
  private airTanks: LogEntryAirDTO[];

  readonly conditions: EntryConditions;
  readonly depths: EntryDepths;
  readonly equipment: EntryEquipment;
  readonly timing: EntryTiming;

  constructor(
    private readonly Entries: Repository<LogEntryEntity>,
    private readonly EntriesAir: Repository<LogEntryAirEntity>,
    private readonly siteFactory: DiveSiteFactory,
    private readonly data: LogEntryEntity,
  ) {
    this.airTanks = data.air?.map(LogEntryAirUtils.entityToDTO) ?? [];
    this.conditions = new EntryConditions(data);
    this.depths = new EntryDepths(data);
    this.equipment = new EntryEquipment(data);
    this.timing = new EntryTiming(data);
  }

  // Metadata
  get id(): string {
    return this.data.id;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.data.updatedAt ?? undefined;
  }

  get owner(): SuccinctProfileDTO {
    return {
      userId: this.data.owner.id,
      username: this.data.owner.username,
      memberSince: this.data.owner.memberSince,
      logBookSharing: this.data.owner.logBookSharing,
      avatar: this.data.owner.avatar,
      name: this.data.owner.name,
      location: this.data.owner.location,
    };
  }

  get logNumber(): number | undefined {
    return this.data.logNumber || undefined;
  }
  set logNumber(value: number | undefined) {
    this.data.logNumber = value ?? null;
  }

  // Dive site
  get site(): DiveSite | undefined {
    return this.data.site
      ? this.siteFactory.createDiveSite(this.data.site)
      : undefined;
  }
  set site(value: DiveSite | undefined) {
    this.data.site = value?.toEntity() ?? null;
  }

  // Air consumption
  get air(): LogEntryAirDTO[] {
    return this.airTanks;
  }
  set air(values: LogEntryAirDTO[]) {
    this.airTanks = values;
  }

  // Misc.
  get notes(): string | undefined {
    return this.data.notes ?? undefined;
  }
  set notes(value: string | undefined) {
    this.data.notes = value ?? null;
  }

  get tags(): string[] {
    return this.data.tags;
  }
  set tags(value: string[]) {
    this.data.tags = value;
  }

  toJSON(): LogEntryDTO {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      creator: this.owner,

      logNumber: this.logNumber,
      site: this.site?.toJSON(),
      air: this.air,

      conditions: this.conditions.toJSON(),
      depths: this.depths.toJSON(),
      equipment: this.equipment.toJSON(),
      timing: this.timing.toJSON(),

      notes: this.notes,
      tags: this.tags,
    };
  }

  toSuccinctJSON(): SuccinctLogEntryDTO {
    return {
      createdAt: this.createdAt,
      creator: this.owner,
      id: this.id,
      depths: this.depths.toJSON(),
      timing: this.timing.toJSON(),
      logNumber: this.logNumber,
      site: this.site?.toJSON(),
      updatedAt: this.updatedAt,
    };
  }

  toEntity(): LogEntryEntity {
    return { ...this.data };
  }

  async save(): Promise<void> {
    this.log.debug(`Attempting to save log entry "${this.id}"...`);

    this.data.air = this.airTanks.map((tank, index) => ({
      ...LogEntryAirUtils.dtoToEntity(tank),
      ordinal: index,
    }));
    this.data.updatedAt = new Date();

    await this.EntriesAir.delete({ logEntry: { id: this.data.id } });
    await this.Entries.save(this.data);
    await this.EntriesAir.save(
      this.data.air.map((tank) => ({
        ...tank,
        logEntry: { id: this.data.id },
      })),
    );
  }

  async delete(): Promise<void> {
    this.log.debug(`Attempting to delete log entry "${this.id}"...`);
    await this.Entries.delete(this.id);
  }
}
