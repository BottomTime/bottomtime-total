import {
  CreateOrUpdateDiveSiteDTO,
  DiveSiteSchema,
  SearchDiveSitesParamsDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import { AxiosInstance } from 'axios';

import { DiveSite } from '.';

export class DiveSitesApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async createDiveSite(site: CreateOrUpdateDiveSiteDTO): Promise<DiveSite> {
    const { data } = await this.apiClient.post('/api/diveSites', site);
    return new DiveSite(this.apiClient, DiveSiteSchema.parse(data));
  }

  async getDiveSite(id: string): Promise<DiveSite> {
    const url = `/api/diveSites/${id}`;
    const { data } = await this.apiClient.get(url);
    return new DiveSite(this.apiClient, DiveSiteSchema.parse(data));
  }

  searchQueryString(params: SearchDiveSitesParamsDTO = {}): string {
    const query = new URLSearchParams();

    if (params.creator) query.set('creator', params.creator);
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.query) query.set('query', params.query);
    if (params.skip) query.set('skip', params.skip.toString());
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    if (typeof params.freeToDive === 'boolean') {
      query.set('freeToDive', params.freeToDive.toString());
    }

    if (typeof params.shoreAccess === 'boolean') {
      query.set('shoreAccess', params.shoreAccess.toString());
    }

    if (params.difficulty) {
      query.set(
        'difficulty',
        `${params.difficulty.min},${params.difficulty.max}`,
      );
    }

    if (params.rating) {
      query.set('rating', `${params.rating.min},${params.rating.max}`);
    }

    if (params.location) {
      query.set('location', `${params.location.lat},${params.location.lon}`);
      query.set('radius', params.radius?.toString() || '50');
    }

    return query.toString();
  }

  async searchDiveSites(query: SearchDiveSitesParamsDTO = {}): Promise<{
    sites: DiveSite[];
    totalCount: number;
  }> {
    const url = `api/diveSites?${this.searchQueryString(query)}`;
    const { data } = await this.apiClient.get(url);

    const result = SearchDiveSitesResponseSchema.parse(data);

    return {
      sites: result.sites.map((site) => new DiveSite(this.apiClient, site)),
      totalCount: result.totalCount,
    };
  }

  wrapDTO(dto: unknown): DiveSite {
    return new DiveSite(this.apiClient, DiveSiteSchema.parse(dto));
  }
}
