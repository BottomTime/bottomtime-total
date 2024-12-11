import {
  ApiList,
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  DiveSiteDTO,
  DiveSiteSchema,
  GetNextAvailableLogNumberResponseDTO,
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseSchema,
  LogEntryDTO,
  LogEntrySchema,
} from '../types';
import { Fetcher } from './fetcher';
import { LogEntry } from './log-entry';

export class LogEntriesApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async listLogEntries(
    username: string,
    params?: ListLogEntriesParamsDTO,
  ): Promise<ApiList<LogEntry>> {
    const { data: results } = await this.apiClient.get(
      `/api/users/${username}/logbook`,
      params,
      ListLogEntriesResponseSchema,
    );

    return {
      data: results.data.map((entry) => new LogEntry(this.apiClient, entry)),
      totalCount: results.totalCount,
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
  ): Promise<DiveSiteDTO[]> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/logbook/recentDiveSites`,
      { count },
      DiveSiteSchema.array(),
    );

    return data;
  }

  async updateLogEntry(
    ownerUsername: string,
    entryId: string,
    entryData: CreateOrUpdateLogEntryParamsDTO,
  ): Promise<LogEntryDTO> {
    const { data } = await this.apiClient.put(
      `/api/users/${ownerUsername}/logbook/${entryId}`,
      CreateOrUpdateLogEntryParamsSchema.parse(entryData),
      LogEntrySchema,
    );
    return data;
  }

  async deleteLogEntry(ownerUsername: string, entryId: string): Promise<void> {
    await this.apiClient.delete(
      `/api/users/${ownerUsername}/logbook/${entryId}`,
    );
  }

  wrapDTO(data: unknown): LogEntry {
    return new LogEntry(this.apiClient, LogEntrySchema.parse(data));
  }
}
