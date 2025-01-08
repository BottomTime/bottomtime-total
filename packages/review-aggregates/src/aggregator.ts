import { Client } from 'pg';

import { AggregateIds } from './types';

export class Aggregator {
  constructor(private readonly client: Client) {}

  async aggregate(ids: AggregateIds): Promise<void> {
    const diveSiteQuery = `
UPDATE "dive_sites" ds SET ("averageRating", "averageDifficulty") =
(
  SELECT avg(rating), avg(difficulty)
  FROM "dive_site_reviews" dsr
  WHERE ds.id = dsr."siteId"
)
WHERE ds.id in(${ids.diveSiteIds.map((id) => `'${id}'`).join(', ')});
    `;
    await this.client.query(diveSiteQuery);

    const operatorQuery = `
UPDATE "dive_operators" op SET ("averageRating") =
(
  SELECT avg(rating)
  FROM "dive_operator_reviews" opr
  WHERE op.id = opr."operatorId"
)
WHERE op.id in(${ids.operatorIds.map((id) => `'${id}'`).join(', ')});
    `;
    await this.client.query(operatorQuery);
  }
}
