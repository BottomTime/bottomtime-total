import {
  DateWithTimezoneDTO,
  DepthDTO,
  DiveSiteDTO,
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

  get site(): DiveSiteDTO | undefined {
    return this.data.site
      ? {
          createdOn: this.data.site.createdOn,
          creator: {
            logBookSharing: this.data.site.creator.logBookSharing,
            memberSince: this.data.site.creator.memberSince,
            userId: this.data.site.creator.id,
            username: this.data.site.creator.username,
            avatar: this.data.site.creator.avatar,
            name: this.data.site.creator.name,
            location: this.data.site.creator.location,
          },
          id: this.data.site.id,
          location: this.data.site.location,
          name: this.data.site.name,
        }
      : undefined;
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
      site: this.site
        ? {
            createdOn: this.site.createdOn,
            creator: {
              userId: this.site.creator.userId,
              username: this.site.creator.username,
              memberSince: this.site.creator.memberSince,
              logBookSharing: this.site.creator.logBookSharing,
              avatar: this.site.creator.avatar,
              name: this.site.creator.name,
              location: this.site.creator.location,
            },
            id: this.site.id,
            location: this.site.location,
            name: this.site.name,
          }
        : undefined,
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
