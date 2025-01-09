import Logger from 'bunyan';
import { Client } from 'pg';

import { AggregateIds } from './types';

export class Aggregator {
  constructor(private readonly client: Client, private readonly log: Logger) {}

  async aggregate(ids: AggregateIds): Promise<void> {
    this.log.debug(
      `Aggregating ratings and difficulties for ${ids.diveSiteIds.length} dive sites...`,
    );

    if (ids.diveSiteIds.length) {
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
    }

    this.log.debug(
      `Aggregating ratings for ${ids.operatorIds.length} operators...`,
    );
    if (ids.operatorIds.length) {
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
}
