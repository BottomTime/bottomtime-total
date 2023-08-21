import { SuperAgentStatic } from 'superagent';
import { z } from 'zod';

import { assertValid } from '@/helpers';
import {
  DiveSite,
  DiveSiteData,
  DiveSiteFullSchema,
  DiveSiteManager,
  DiveSiteSearchOptions,
} from './interfaces';
import { DefaultDiveSite } from './default-dive-site';

const SearchDiveSitesResponseSchema = z.object({
  results: z.number().int(),
  sites: z.array(DiveSiteFullSchema),
});
type SearchDiveSitesResponse = z.infer<typeof SearchDiveSitesResponseSchema>;

export class DefaultDiveSiteManager implements DiveSiteManager {
  constructor(private readonly agent: SuperAgentStatic) {}

  async getDiveSite(id: string): Promise<DiveSite> {
    const { body } = await this.agent.get(`/api/diveSites/${id}`);
    const data = assertValid<DiveSiteData>(body, DiveSiteFullSchema);
    return new DefaultDiveSite(this.agent, data);
  }

  async searchDiveSites(options?: DiveSiteSearchOptions): Promise<DiveSite[]> {
    const query: Record<string, unknown> = {};

    if (options?.query) {
      query.query = options.query;
    }

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
