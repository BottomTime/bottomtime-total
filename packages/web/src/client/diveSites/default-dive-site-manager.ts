import { SuperAgentStatic } from 'superagent';
import { DiveSite, DiveSiteManager, DiveSiteSearchOptions } from './interfaces';
import { DefaultDiveSite } from './default-dive-site';
import { DiveSiteSchema, DiveSiteSummarySchema } from './validation';

export class DefaultDiveSiteManager implements DiveSiteManager {
  constructor(private readonly agent: SuperAgentStatic) {}

  async getDiveSite(id: string): Promise<DiveSite> {
    const { body: data } = await this.agent.get(`/api/diveSites/${id}`);
    return new DefaultDiveSite(this.agent, DiveSiteSchema.validate(data).value);
  }

  async searchDiveSites(options?: DiveSiteSearchOptions): Promise<DiveSite[]> {
    const query: Record<string, unknown> = {};

    if (options?.query) {
      query.query = options.query;
    }

    const {
      body: { sites },
    } = await this.agent.get('/api/diveSites').query(query);

    return sites.map(
      (site: object) =>
        new DefaultDiveSite(
          this.agent,
          DiveSiteSummarySchema.validate(site).value,
        ),
    );
  }
}
