import { AxiosInstance } from 'axios';

import {
  DateWithTimezoneDTO,
  DepthDTO,
  LogEntryDTO,
  SuccinctProfileDTO,
} from '../types';

export class LogEntry {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: LogEntryDTO,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get creator(): SuccinctProfileDTO {
    return { ...this.data.creator };
  }

  get logNumber(): number | undefined {
    return this.data.logNumber;
  }
  set logNumber(value: number | undefined) {
    this.data.logNumber = value;
  }

  get entryTime(): DateWithTimezoneDTO {
    return { ...this.data.entryTime };
  }
  set entryTime(value: DateWithTimezoneDTO) {
    this.data.entryTime = value;
  }

  get duration(): number {
    return this.data.duration;
  }
  set duration(value: number) {
    this.data.duration = value;
  }

  get bottomTime(): number | undefined {
    return this.data.bottomTime;
  }
  set bottomTime(value: number | undefined) {
    this.data.bottomTime = value;
  }

  get maxDepth(): DepthDTO | undefined {
    return this.data.maxDepth ? { ...this.data.maxDepth } : undefined;
  }
  set maxDepth(value: DepthDTO | undefined) {
    this.data.maxDepth = value;
  }

  get notes(): string | undefined {
    return this.data.notes;
  }
  set notes(value: string | undefined) {
    this.data.notes = value;
  }

  toJSON(): LogEntryDTO {
    return { ...this.data };
  }
}
