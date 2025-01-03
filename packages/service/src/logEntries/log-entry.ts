import {
  DepthUnit,
  ExposureSuit,
  LogEntryAirDTO,
  LogEntryConditionsDTO,
  LogEntryDTO,
  LogEntryDepthsDTO,
  LogEntryEquipmentDTO,
  LogEntrySampleDTO,
  LogEntryTimingDTO,
  SuccinctLogEntryDTO,
  SuccinctProfileDTO,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

import { ConflictException, Logger } from '@nestjs/common';

import { Observable, bufferCount, concatMap, from, map } from 'rxjs';
import { In, Repository } from 'typeorm';

import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
} from '../data';
import { DiveSite, DiveSiteFactory } from '../diveSites';
import { Operator, OperatorFactory } from '../operators';
import { LogEntryAirUtils } from './log-entry-air-utils';
import { LogEntrySampleUtils } from './log-entry-sample-utils';

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

  get entryTime(): Date {
    return this.data.entryTime;
  }
  set entryTime(value: Date) {
    this.data.entryTime = value;
  }

  get timezone(): string {
    return this.data.timezone;
  }
  set timezone(value: string) {
    this.data.timezone = value;
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
      entryTime: this.entryTime.valueOf(),
      timezone: this.timezone,
      duration: this.duration,
      bottomTime: this.bottomTime,
    };
  }
}

export class LogEntry {
  private readonly log = new Logger(LogEntry.name);

  readonly conditions: EntryConditions;
  readonly depths: EntryDepths;
  readonly equipment: EntryEquipment;
  readonly timing: EntryTiming;

  constructor(
    private readonly Entries: Repository<LogEntryEntity>,
    private readonly EntryAir: Repository<LogEntryAirEntity>,
    private readonly EntrySamples: Repository<LogEntrySampleEntity>,
    private readonly siteFactory: DiveSiteFactory,
    private readonly operatorFactory: OperatorFactory,
    private readonly data: LogEntryEntity,
  ) {
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
      accountTier: this.data.owner.accountTier,
      userId: this.data.owner.id,
      username: this.data.owner.username,
      memberSince: this.data.owner.memberSince.valueOf(),
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

  get operator(): Operator | undefined {
    return this.data.operator
      ? this.operatorFactory.createOperator(this.data.operator)
      : undefined;
  }
  set operator(value: Operator | undefined) {
    this.data.operator = value?.toEntity() ?? null;
  }

  // Air consumption
  get air(): readonly LogEntryAirDTO[] {
    return (
      this.data.air
        ?.sort((a, b) => a.ordinal - b.ordinal)
        .map(LogEntryAirUtils.entityToDTO) ?? []
    );
  }
  set air(values: readonly LogEntryAirDTO[]) {
    this.data.air = values.map((air, ordinal) =>
      LogEntryAirUtils.dtoToEntity(air, ordinal, this.id),
    );
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

  private async *loadSamples(): AsyncGenerator<LogEntrySampleEntity, number> {
    const batchSize = 1000;
    let totalCount = 0;
    let skip = 0;
    let batch: LogEntrySampleEntity[];

    do {
      this.log.debug(
        `Querying for batch of data samples for log entry "${this.id}"...`,
      );
      batch = await this.EntrySamples.find({
        where: { logEntry: { id: this.id } },
        order: { timeOffset: 'ASC' },
        skip,
        take: batchSize,
      });
      totalCount += batch.length;

      for (const sample of batch) {
        yield sample;
      }

      skip += batchSize;
    } while (batch.length === batchSize);

    this.log.debug('Finished loading samples.');
    return totalCount;
  }

  toJSON(): LogEntryDTO {
    return {
      id: this.id,
      createdAt: this.createdAt.valueOf(),
      updatedAt: this.updatedAt?.valueOf(),
      creator: this.owner,

      logNumber: this.logNumber,
      site: this.site?.toJSON(),
      air: [...this.air],

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
      createdAt: this.createdAt.valueOf(),
      creator: this.owner,
      id: this.id,
      depths: this.depths.toJSON(),
      timing: this.timing.toJSON(),
      logNumber: this.logNumber,
      site: this.site?.toJSON(),
      updatedAt: this.updatedAt?.valueOf(),
    };
  }

  toEntity(): LogEntryEntity {
    return { ...this.data };
  }

  async save(): Promise<void> {
    this.log.debug(`Attempting to save log entry "${this.id}"...`);
    this.data.updatedAt = new Date();

    await this.EntryAir.delete({ logEntry: { id: this.data.id } });
    await this.Entries.save(this.data);

    if (this.data.air) {
      await this.EntryAir.delete({ logEntry: { id: this.data.id } });
      await this.EntryAir.save(this.data.air);
    }
  }

  async delete(): Promise<void> {
    this.log.debug(`Attempting to delete log entry "${this.id}"...`);
    await this.Entries.delete(this.id);
  }

  getSamples(): Observable<LogEntrySampleDTO> {
    return from(this.loadSamples()).pipe(map(LogEntrySampleUtils.entityToDTO));
  }

  async getSampleCount(): Promise<number> {
    return await this.EntrySamples.countBy({ logEntry: { id: this.id } });
  }

  async saveSamples(samples: Observable<LogEntrySampleDTO>): Promise<void> {
    await new Promise<void>((complete, error) => {
      samples
        .pipe(
          map((sample) => LogEntrySampleUtils.dtoToEntity(sample, this.id)),
          bufferCount(500),
          concatMap(async (batch) => {
            const conflict = await this.EntrySamples.find({
              where: {
                logEntry: { id: this.id },
                timeOffset: In(batch.map((s) => s.timeOffset)),
              },
              order: { timeOffset: 'ASC' },
              select: ['timeOffset'],
            });
            if (conflict.length) {
              throw new ConflictException(
                'Sample time offsets must be unique.',
                {
                  cause: {
                    conflictingOffsets: conflict.map(
                      (sample) => sample.timeOffset,
                    ),
                  },
                },
              );
            }
            await this.EntrySamples.save(batch);
          }),
        )
        .subscribe({ complete, error });
    });

    const [maxDepth, avgDepth] = await Promise.all([
      // Casting to "any" is necessary here due to a limitation in the TypeORM library:
      // Only NOT NULL columns can be used in aggregate functions - despite the fact that
      // Postgres permits performing aggregate functions on nullable columns.

      /* eslint-disable-next-line */
      this.EntrySamples.maximum('depth' as any, {
        logEntry: { id: this.id },
      }),
      /* eslint-disable-next-line */
      this.EntrySamples.average('depth' as any, {
        logEntry: { id: this.id },
      }),
    ]);

    if (maxDepth) this.depths.maxDepth = maxDepth;
    if (avgDepth) this.depths.averageDepth = avgDepth;

    await this.save();
  }

  async clearSamples(): Promise<number> {
    const { affected } = await this.EntrySamples.delete({
      logEntry: { id: this.id },
    });
    return typeof affected === 'number' ? affected : 0;
  }
}
