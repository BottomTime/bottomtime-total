import dayjs from 'dayjs';
import 'dayjs/plugin/timezone';
import { Repository } from 'typeorm';

import { LogEntryEntity } from '../data';

export class LogEntry {
  constructor(
    private readonly Entries: Repository<LogEntryEntity>,
    private readonly data: LogEntryEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get logNumber(): number | undefined {
    return this.data.logNumber;
  }

  get entryTime(): Date {
    return dayjs(this.data.entryTime).toDate();
  }

  get timezone(): string {
    return this.data.timezone;
  }

  get bottomTime(): number | undefined {
    return this.data.bottomTime;
  }

  get duration(): number | undefined {
    return this.data.duration;
  }

  get maxDepth(): number | undefined {
    return this.data.maxDepth;
  }

  get maxDepthUnit(): string | undefined {
    return this.data.maxDepthUnit;
  }

  get notes(): string | undefined {
    return this.data.notes;
  }
}
