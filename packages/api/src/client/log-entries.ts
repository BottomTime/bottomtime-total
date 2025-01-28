import {
  ApiList,
  CreateOrUpdateDiveSiteReviewDTO,
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  CreateOrUpdateOperatorReviewDTO,
  DiveSiteDTO,
  DiveSiteReviewDTO,
  DiveSiteReviewSchema,
  DiveSiteSchema,
  GetNextAvailableLogNumberResponseDTO,
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseSchema,
  LogEntryDTO,
  LogEntrySampleDTO,
  LogEntrySampleSchema,
  LogEntrySchema,
  OperatorDTO,
  OperatorReviewDTO,
  OperatorReviewSchema,
  OperatorSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class LogEntriesApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  private getLogbookUrl(username: string): string {
    return `/api/users/${username}/logbook`;
  }

  private getLogEntryUrl(username: string, entryId: string): string {
    return `${this.getLogbookUrl(username)}/${entryId}`;
  }

  private getOperatorReviewUrl(username: string, entryId: string): string {
    return `${this.getLogEntryUrl(username, entryId)}/reviewOperator`;
  }

  private getSiteReviewUrl(username: string, entryId: string): string {
    return `${this.getLogEntryUrl(username, entryId)}/reviewSite`;
  }

  async listLogEntries(
    username: string,
    params?: ListLogEntriesParamsDTO,
  ): Promise<ApiList<LogEntryDTO>> {
    const { data: results } = await this.apiClient.get(
      this.getLogbookUrl(username),
      params,
      ListLogEntriesResponseSchema,
    );
    return results;
  }

  async getLogEntry(username: string, entryId: string): Promise<LogEntryDTO> {
    const { data } = await this.apiClient.get(
      this.getLogEntryUrl(username, entryId),
      undefined,
      LogEntrySchema,
    );
    return data;
  }

  async createLogEntry(
    username: string,
    options: CreateOrUpdateLogEntryParamsDTO,
  ): Promise<LogEntryDTO> {
    const { data } = await this.apiClient.post(
      this.getLogbookUrl(username),
      options,
      LogEntrySchema,
    );
    return data;
  }

  async getNextAvailableLogNumber(username: string): Promise<number> {
    const {
      data: { logNumber },
    } = await this.apiClient.get<GetNextAvailableLogNumberResponseDTO>(
      `${this.getLogbookUrl(username)}/nextLogEntryNumber`,
    );
    return logNumber;
  }

  async getMostRecentDiveSites(
    username: string,
    count?: number,
  ): Promise<DiveSiteDTO[]> {
    const { data } = await this.apiClient.get(
      `${this.getLogbookUrl(username)}/recentDiveSites`,
      { count },
      DiveSiteSchema.array(),
    );
    return data;
  }

  async getMostRecentDiveOperators(
    username: string,
    count?: number,
  ): Promise<OperatorDTO[]> {
    const { data } = await this.apiClient.get(
      `${this.getLogbookUrl(username)}/recentOperators`,
      { count },
      OperatorSchema.array(),
    );
    return data;
  }

  async updateLogEntry(
    ownerUsername: string,
    entryId: string,
    entryData: CreateOrUpdateLogEntryParamsDTO,
  ): Promise<LogEntryDTO> {
    const { data } = await this.apiClient.put(
      this.getLogEntryUrl(ownerUsername, entryId),
      CreateOrUpdateLogEntryParamsSchema.parse(entryData),
      LogEntrySchema,
    );
    return data;
  }

  async deleteLogEntry(ownerUsername: string, entryId: string): Promise<void> {
    await this.apiClient.delete(this.getLogEntryUrl(ownerUsername, entryId));
  }

  async loadLogEntrySampleData(
    username: string,
    logEntryId: string,
  ): Promise<LogEntrySampleDTO[]> {
    const { data } = await this.apiClient.get(
      `${this.getLogEntryUrl(username, logEntryId)}/samples`,
      undefined,
      LogEntrySampleSchema.array(),
    );
    return data;
  }

  async getOperatorReview(
    username: string,
    entryId: string,
  ): Promise<OperatorReviewDTO> {
    const { data } = await this.apiClient.get(
      this.getOperatorReviewUrl(username, entryId),
      undefined,
      OperatorReviewSchema,
    );
    return data;
  }

  async reviewOperator(
    username: string,
    entryId: string,
    review: CreateOrUpdateOperatorReviewDTO,
  ): Promise<OperatorReviewDTO> {
    const { data } = await this.apiClient.put(
      this.getOperatorReviewUrl(username, entryId),
      review,
      OperatorReviewSchema,
    );
    return data;
  }

  async getSiteReview(
    username: string,
    entryId: string,
  ): Promise<DiveSiteReviewDTO> {
    const { data } = await this.apiClient.get(
      this.getSiteReviewUrl(username, entryId),
      undefined,
      DiveSiteReviewSchema,
    );
    return data;
  }

  async reviewSite(
    username: string,
    entryId: string,
    review: CreateOrUpdateDiveSiteReviewDTO,
  ): Promise<DiveSiteReviewDTO> {
    const { data } = await this.apiClient.put(
      this.getSiteReviewUrl(username, entryId),
      review,
      DiveSiteReviewSchema,
    );
    return data;
  }
}
