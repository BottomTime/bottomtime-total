import { AxiosInstance } from 'axios';

import {
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseSchema,
  LogEntrySchema,
} from '../types';
import { LogEntry } from './log-entry';

export class LogEntriesApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async listLogEntries(
    username: string,
    params: ListLogEntriesParamsDTO,
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
      logEntries: [],
      totalCount: parsed.totalCount,
    };
  }

  wrapDTO(data: unknown): LogEntry {
    return new LogEntry(this.apiClient, LogEntrySchema.parse(data));
  }
}
