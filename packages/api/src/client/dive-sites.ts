import { DiveSite } from '.';
import {
  ApiList,
  CreateOrUpdateDiveSiteDTO,
  DiveSiteSchema,
  SearchDiveSitesParamsDTO,
  SearchDiveSitesResponseSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class DiveSitesApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async createDiveSite(site: CreateOrUpdateDiveSiteDTO): Promise<DiveSite> {
    const { data } = await this.apiClient.post(
      '/api/diveSites',
      site,
      DiveSiteSchema,
    );
    return new DiveSite(this.apiClient, data);
  }

  async getDiveSite(id: string): Promise<DiveSite> {
    const { data } = await this.apiClient.get(
      `/api/diveSites/${id}`,
      undefined,
      DiveSiteSchema,
    );
    return new DiveSite(this.apiClient, data);
  }

  searchQueryString(
    params: SearchDiveSitesParamsDTO = {},
  ): Record<string, string> {
    const query: Record<string, string> = {};

    if (params.creator) query.creator = params.creator;
    if (params.limit) query.limit = params.limit.toString();
    if (params.query) query.query = params.query;
    if (params.skip) query.skip = params.skip.toString();
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;
    if (params.waterType) query.waterType = params.waterType;

    if (typeof params.freeToDive === 'boolean') {
      query.freeToDive = params.freeToDive.toString();
    }

    if (typeof params.shoreAccess === 'boolean') {
      query.shoreAccess = params.shoreAccess.toString();
    }

    if (params.difficulty) {
      query.difficulty = `${params.difficulty.min},${params.difficulty.max}`;
    }

    if (params.rating) {
      query.rating = `${params.rating.min},${params.rating.max}`;
    }

    if (params.location) {
      query.location = `${params.location.lat},${params.location.lon}`;
      query.radius = params.radius?.toString() || '50';
    }

    return query;
  }

  async searchDiveSites(
    query: SearchDiveSitesParamsDTO = {},
  ): Promise<ApiList<DiveSite>> {
    const { data: result } = await this.apiClient.get(
      `/api/diveSites?${this.searchQueryString(query)}`,
      undefined,
      SearchDiveSitesResponseSchema,
    );

    return {
      data: result.data.map((site) => new DiveSite(this.apiClient, site)),
      totalCount: result.totalCount,
    };
  }

  wrapDTO(dto: unknown): DiveSite {
    return new DiveSite(this.apiClient, DiveSiteSchema.parse(dto));
  }
}
