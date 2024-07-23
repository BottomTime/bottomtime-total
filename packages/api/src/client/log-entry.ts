import {
  CreateOrUpdateLogEntryParamsSchema,
  DiveSiteDTO,
  LogEntryAirDTO,
  LogEntryConditionsDTO,
  LogEntryDTO,
  LogEntryDepthsDTO,
  LogEntryEquipmentDTO,
  LogEntrySchema,
  LogEntryTimingDTO,
  SuccinctProfileDTO,
} from '../types';
import { Fetcher } from './fetcher';

export class LogEntry {
  constructor(private readonly client: Fetcher, private data: LogEntryDTO) {}

  get id(): string {
    return this.data.id;
  }

  get creator(): SuccinctProfileDTO {
    return { ...this.data.creator };
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.data.updatedAt;
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

  get timing(): LogEntryTimingDTO {
    return this.data.timing;
  }

  get conditions(): LogEntryConditionsDTO {
    if (!this.data.conditions) this.data.conditions = {};
    return this.data.conditions;
  }

  get depths(): LogEntryDepthsDTO {
    if (!this.data.depths) this.data.depths = {};
    return this.data.depths;
  }

  get equipment(): LogEntryEquipmentDTO {
    if (!this.data.equipment) this.data.equipment = {};
    return this.data.equipment;
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

  get tags(): string[] | undefined {
    return this.data.tags;
  }
  set tags(value: string[] | undefined) {
    this.data.tags = value;
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
      LogEntrySchema,
    );
    this.data = data;
  }

  async delete(): Promise<void> {
    await this.client.delete(
      `/api/users/${this.data.creator.username}/logbook/${this.data.id}`,
    );
  }
}
