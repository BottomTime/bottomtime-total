import { SuperAgentStatic } from 'superagent';
import { z } from 'zod';

import { assertValid } from '@/helpers';
import {
  CreateDiveSiteData,
  DiveSite,
  DiveSiteData,
  DiveSiteFullSchema,
  DiveSiteManager,
  SearchDiveSitesOptions,
  SearchDiveSitesOptionsSchema,
} from './interfaces';
import { DefaultDiveSite } from './default-dive-site';

const SearchDiveSitesQueryStringSchema = SearchDiveSitesOptionsSchema.transform(
  (options) => ({
    ...options,
    location: options?.location
      ? `${options.location.lat},${options.location.lon}`
      : undefined,
    rating: options?.rating
      ? `${options.rating.min}-${options.rating.max}`
      : undefined,
    difficulty: options?.difficulty
      ? `${options.difficulty.min}-${options.difficulty.max}`
      : undefined,
  }),
);
type SearchDiveSitesQueryString = z.infer<
  typeof SearchDiveSitesQueryStringSchema
>;

const SearchDiveSitesResponseSchema = z.object({
  results: z.number(),
  sites: z.array(DiveSiteFullSchema),
});
type SearchDiveSitesResponse = z.infer<typeof SearchDiveSitesResponseSchema>;

export class DefaultDiveSiteManager implements DiveSiteManager {
  constructor(private readonly agent: SuperAgentStatic) {}

  async createDiveSite(data: CreateDiveSiteData): Promise<DiveSite> {
    const { body } = await this.agent.post(`/api/diveSites`).send(data);
    const site = assertValid<DiveSiteData>(body, DiveSiteFullSchema);
    return new DefaultDiveSite(this.agent, site);
  }

  async getDiveSite(id: string): Promise<DiveSite> {
    const { body } = await this.agent.get(`/api/diveSites/${id}`);
    const data = assertValid<DiveSiteData>(body, DiveSiteFullSchema);
    return new DefaultDiveSite(this.agent, data);
  }

  async searchDiveSites(
    options: SearchDiveSitesOptions = {},
  ): Promise<DiveSite[]> {
    const query = assertValid<SearchDiveSitesQueryString>(
      options,
      SearchDiveSitesQueryStringSchema,
    );

    const { body } = await this.agent.get('/api/diveSites').query(query);
    const response = assertValid<SearchDiveSitesResponse>(
      body,
      SearchDiveSitesResponseSchema,
    );

    return response.sites.map(
      (site: DiveSiteData) => new DefaultDiveSite(this.agent, site),
    );
  }
}
