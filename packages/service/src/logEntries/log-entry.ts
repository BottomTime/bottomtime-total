import {
  DateWithTimezoneDTO,
  DepthDTO,
  LogEntryAirDTO,
  LogEntryDTO,
  SuccinctProfileDTO,
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

export class LogEntry {
  private readonly log = new Logger(LogEntry.name);
  private airTanks: LogEntryAirDTO[];

  constructor(
    private readonly Entries: Repository<LogEntryEntity>,
    private readonly EntriesAir: Repository<LogEntryAirEntity>,
    private readonly siteFactory: DiveSiteFactory,
    private readonly data: LogEntryEntity,
  ) {
    this.airTanks = data.air?.map(LogEntryAirUtils.entityToDTO) ?? [];
  }

  get id(): string {
    return this.data.id;
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

  get site(): DiveSite | undefined {
    return this.data.site
      ? this.siteFactory.createDiveSite(this.data.site)
      : undefined;
  }
  set site(value: DiveSite | undefined) {
    this.data.site = value?.toEntity() ?? null;
  }

  get logNumber(): number | undefined {
    return this.data.logNumber || undefined;
  }
  set logNumber(value: number | undefined) {
    this.data.logNumber = value ?? null;
  }

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

  get bottomTime(): number | undefined {
    return this.data.bottomTime ?? undefined;
  }
  set bottomTime(value: number | undefined) {
    this.data.bottomTime = value ?? null;
  }

  get duration(): number {
    return this.data.duration;
  }
  set duration(value: number) {
    this.data.duration = value;
  }

  get maxDepth(): DepthDTO | undefined {
    if (typeof this.data.maxDepth !== 'number' || !this.data.maxDepthUnit) {
      return undefined;
    }

    return {
      depth: this.data.maxDepth,
      unit: this.data.maxDepthUnit,
    };
  }
  set maxDepth(value: DepthDTO | undefined) {
    this.data.maxDepth = value?.depth ?? null;
    this.data.maxDepthUnit = value?.unit ?? null;
  }

  get notes(): string | undefined {
    return this.data.notes ?? undefined;
  }
  set notes(value: string | undefined) {
    this.data.notes = value ?? null;
  }

  get air(): LogEntryAirDTO[] {
    return this.airTanks;
  }
  set air(values: LogEntryAirDTO[]) {
    this.airTanks = values;
  }

  toJSON(): LogEntryDTO {
    return {
      id: this.id,
      logNumber: this.logNumber,
      creator: this.owner,
      entryTime: this.entryTime,
      bottomTime: this.bottomTime,
      duration: this.duration,
      maxDepth: this.maxDepth,
      notes: this.notes,
      site: this.site?.toJSON(),
      air: this.air,
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
