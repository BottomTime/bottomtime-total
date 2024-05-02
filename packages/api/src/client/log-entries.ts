import { AxiosInstance } from 'axios';

import {
  CreateOrUpdateLogEntryParamsDTO,
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseSchema,
  LogEntrySchema,
} from '../types';
import { LogEntry } from './log-entry';

export class LogEntriesApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async listLogEntries(
    username: string,
    params?: ListLogEntriesParamsDTO,
  ): Promise<{
    logEntries: LogEntry[];
    totalCount: number;
  }> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/logbook`,
      { params },
    );

    const parsed = ListLogEntriesResponseSchema.parse(data);
    return {
      logEntries: parsed.logEntries.map(
        (entry) => new LogEntry(this.apiClient, entry),
      ),
      totalCount: parsed.totalCount,
    };
  }

  async getLogEntry(username: string, entryId: string): Promise<LogEntry> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/logbook/${entryId}`,
    );
    return this.wrapDTO(data);
  }

  async createLogEntry(
    username: string,
    options: CreateOrUpdateLogEntryParamsDTO,
  ): Promise<LogEntry> {
    const { data } = await this.apiClient.post(
      `/api/users/${username}/logbook`,
      options,
    );
    return this.wrapDTO(data);
  }

  wrapDTO(data: unknown): LogEntry {
    return new LogEntry(this.apiClient, LogEntrySchema.parse(data));
  }
}
