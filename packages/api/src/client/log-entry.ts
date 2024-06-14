import { AxiosInstance } from 'axios';

import {
  CreateOrUpdateLogEntryParamsSchema,
  DateWithTimezoneDTO,
  DepthDTO,
  DiveSiteDTO,
  LogEntryAirDTO,
  LogEntryDTO,
  LogEntrySchema,
  SuccinctProfileDTO,
  WeightDTO,
} from '../types';

export class LogEntry {
  constructor(
    private readonly client: AxiosInstance,
    private data: LogEntryDTO,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get creator(): SuccinctProfileDTO {
    return { ...this.data.creator };
  }

  get site(): DiveSiteDTO | undefined {
    return this.data.site ? { ...this.data.site } : undefined;
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

  get air(): LogEntryAirDTO[] | undefined {
    return this.data.air;
  }
  set air(value: LogEntryAirDTO[] | undefined) {
    this.data.air = value;
  }

  get weights(): WeightDTO | undefined {
    return this.data.weights ? { ...this.data.weights } : undefined;
  }
  set weights(value: WeightDTO | undefined) {
    this.data.weights = value;
  }

  toJSON(): LogEntryDTO {
    return { ...this.data };
  }

  async save(): Promise<void> {
    const { data } = await this.client.put(
      `/api/users/${this.data.creator.username}/logbook/${this.data.id}`,
      CreateOrUpdateLogEntryParamsSchema.parse({
        ...this.data,
        site: this.data.site ? this.data.site.id : undefined,
      }),
    );
    this.data = LogEntrySchema.parse(data);
  }

  async delete(): Promise<void> {
    await this.client.delete(
      `/api/users/${this.data.creator.username}/logbook/${this.data.id}`,
    );
  }
}
