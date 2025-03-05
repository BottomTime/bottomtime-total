import {
  ApiList,
  CreateOrUpdateDiveSiteReviewDTO,
  CreateOrUpdateLogEntryParamsDTO,
  CreateOrUpdateLogEntryParamsSchema,
  CreateOrUpdateLogEntrySignatureDTO,
  CreateOrUpdateOperatorReviewDTO,
  DiveSiteDTO,
  DiveSiteReviewDTO,
  DiveSiteReviewSchema,
  DiveSiteSchema,
  GetNextAvailableLogNumberResponseDTO,
  ListLogEntriesParamsDTO,
  ListLogEntriesResponseSchema,
  ListLogEntrySignaturesResponseSchema,
  LogEntryDTO,
  LogEntrySampleDTO,
  LogEntrySampleSchema,
  LogEntrySchema,
  LogEntrySignatureDTO,
  LogEntrySignatureSchema,
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

  searchQueryString(
    params: ListLogEntriesParamsDTO = {},
  ): Record<string, string> {
    const query: Record<string, string> = {};

    if (params.endDate) query.endDate = params.endDate.valueOf().toString();
    if (params.limit) query.limit = params.limit.toString();
    if (params.location) {
      query.location = `${params.location.lat.toFixed(
        5,
      )},${params.location.lon.toFixed(5)}`;
      query.radius = params.radius?.toString() || '50';
    }
    if (params.maxRating) query.maxRating = params.maxRating.toFixed(1);
    if (params.minRating) query.minRating = params.minRating.toFixed(1);
    if (params.query) query.query = params.query;
    if (params.skip) query.skip = params.skip.toString();
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    if (params.startDate) {
      query.startDate = params.startDate.valueOf().toString();
    }

    return query;
  }

  async listLogEntries(
    username: string,
    params?: ListLogEntriesParamsDTO,
  ): Promise<ApiList<LogEntryDTO>> {
    const { data: results } = await this.apiClient.get(
      this.getLogbookUrl(username),
      this.searchQueryString(params),
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

  async listLogEntrySignatures(
    username: string,
    entryId: string,
  ): Promise<ApiList<LogEntrySignatureDTO>> {
    const { data } = await this.apiClient.get(
      `${this.getLogEntryUrl(username, entryId)}/signatures`,
      undefined,
      ListLogEntrySignaturesResponseSchema,
    );
    return data;
  }

  async signLogEntry(
    username: string,
    entryId: string,
    buddy: string,
    options: CreateOrUpdateLogEntrySignatureDTO,
  ): Promise<LogEntrySignatureDTO> {
    const { data } = await this.apiClient.put(
      `${this.getLogEntryUrl(username, entryId)}/signatures/${buddy}`,
      options,
      LogEntrySignatureSchema,
    );
    return data;
  }

  async deleteLogEntrySignature(
    username: string,
    entryId: string,
    buddy: string,
  ): Promise<void> {
    await this.apiClient.delete(
      `${this.getLogEntryUrl(username, entryId)}/signatures/${buddy}`,
    );
  }
}
