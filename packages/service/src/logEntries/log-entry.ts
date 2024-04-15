import {
  DateWithTimezoneDTO,
  DepthDTO,
  LogEntryDTO,
  SuccinctProfileDTO,
} from '@bottomtime/api';

import { Logger } from '@nestjs/common';

import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import 'dayjs/plugin/utc';
import { Repository } from 'typeorm';

import { LogEntryEntity } from '../data';

const DateTimeFormat = 'YYYY-MM-DDTHH:mm:ss';

export class LogEntry {
  private readonly log = new Logger(LogEntry.name);

  constructor(
    private readonly Entries: Repository<LogEntryEntity>,
    private readonly data: LogEntryEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get creator(): SuccinctProfileDTO {
    return {
      userId: this.data.creator.id,
      username: this.data.creator.username,
      memberSince: this.data.creator.memberSince,
      avatar: this.data.creator.avatar,
      name: this.data.creator.name,
      location: this.data.creator.location,
    };
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
    const entryTime = dayjs(value.date).tz(value.timezone, true);
    this.data.entryTime = entryTime.format(DateTimeFormat);
    this.data.timezone = value.timezone;
    this.data.timestamp = entryTime.utc().toDate();
  }

  get bottomTime(): number | undefined {
    return this.data.bottomTime ?? undefined;
  }
  set bottomTime(value: number | undefined) {
    this.data.bottomTime = value ?? null;
  }

  get duration(): number | undefined {
    return this.data.duration ?? undefined;
  }
  set duration(value: number | undefined) {
    this.data.duration = value ?? null;
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

  toJSON(): LogEntryDTO {
    return {
      id: this.id,
      logNumber: this.logNumber,
      creator: this.creator,
      entryTime: this.entryTime,
      bottomTime: this.bottomTime,
      duration: this.duration,
      maxDepth: this.maxDepth,
      notes: this.notes,
    };
  }

  async save(): Promise<void> {
    this.log.debug(`Attempting to save log entry "${this.id}"...`);
    await this.Entries.save(this.data);
  }

  async delete(): Promise<void> {
    this.log.debug(`Attempting to delete log entry "${this.id}"...`);
    await this.Entries.delete(this.id);
  }
}
