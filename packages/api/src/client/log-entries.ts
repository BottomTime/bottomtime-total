import { AxiosInstance } from 'axios';

import {
  CreateOrUpdateLogEntryParamsDTO,
  DiveSiteSchema,
  GetNextAvailableLogNumberResponseDTO,
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseSchema,
  LogEntrySchema,
} from '../types';
import { DiveSite } from './dive-site';
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

  async getNextAvailableLogNumber(username: string): Promise<number> {
    const {
      data: { logNumber },
    } = await this.apiClient.get<GetNextAvailableLogNumberResponseDTO>(
      `/api/users/${username}/logbook/nextLogEntryNumber`,
    );
    return logNumber;
  }

  async getMostRecentDiveSites(
    username: string,
    count?: number,
  ): Promise<DiveSite[]> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/logbook/recentDiveSites`,
      { params: { count } },
    );

    return DiveSiteSchema.array()
      .parse(data)
      .map((site) => new DiveSite(this.apiClient, site));
  }

  wrapDTO(data: unknown): LogEntry {
    return new LogEntry(this.apiClient, LogEntrySchema.parse(data));
  }
}
