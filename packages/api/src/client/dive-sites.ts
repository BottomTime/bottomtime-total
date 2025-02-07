import {
  ApiList,
  CreateOrUpdateDiveSiteDTO,
  CreateOrUpdateDiveSiteSchema,
  DiveSiteDTO,
  DiveSiteSchema,
  SearchDiveSitesParamsDTO,
  SearchDiveSitesResponseSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class DiveSitesApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async createDiveSite(site: CreateOrUpdateDiveSiteDTO): Promise<DiveSiteDTO> {
    const { data } = await this.apiClient.post(
      '/api/diveSites',
      site,
      DiveSiteSchema,
    );
    return data;
  }

  async getDiveSite(id: string): Promise<DiveSiteDTO> {
    const { data } = await this.apiClient.get(
      `/api/diveSites/${id}`,
      undefined,
      DiveSiteSchema,
    );
    return data;
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
      query.location = `${params.location.lat.toFixed(
        5,
      )},${params.location.lon.toFixed(5)}`;
      query.radius = params.radius?.toString() || '50';
    }

    return query;
  }

  async searchDiveSites(
    query: SearchDiveSitesParamsDTO = {},
  ): Promise<ApiList<DiveSiteDTO>> {
    const { data: results } = await this.apiClient.get(
      '/api/diveSites',
      this.searchQueryString(query),
      SearchDiveSitesResponseSchema,
    );

    return results;
  }

  async updateSite(site: DiveSiteDTO): Promise<void> {
    const params = CreateOrUpdateDiveSiteSchema.parse(site);
    await this.apiClient.put(`/api/diveSites/${site.id}`, params);
    site.updatedOn = Date.now();
  }
}
