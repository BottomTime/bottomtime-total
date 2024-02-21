import {
  DiveSiteSchema,
  SearchDiveSitesParamsDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import { AxiosInstance } from 'axios';

import { DiveSite } from '.';

export class DiveSitesApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async searchDiveSites(query: SearchDiveSitesParamsDTO = {}): Promise<{
    sites: DiveSite[];
    totalCount: number;
  }> {
    const { data } = await this.apiClient.get('/api/diveSites', {
      params: {
        ...query,
        difficulty: query.difficulty
          ? `${query.difficulty.min},${query.difficulty.max}`
          : undefined,
        rating: query.rating
          ? `${query.rating.min},${query.rating.max}`
          : undefined,
      },
    });

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
