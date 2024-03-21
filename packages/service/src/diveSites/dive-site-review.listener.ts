import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { DiveSiteEntity } from '../data';
import {
  DiveSiteReviewDeletedEvent,
  DiveSiteReviewSavedEvent,
  DiveSite_ReviewDeleted,
  DiveSite_ReviewSaved,
} from './dive-site-review.event';

// TODO: Introduce queuing mechanism to handle these events in case of high traffic or error conditions.
@Injectable()
export class DiveSiteReviewEventListener {
  private readonly log = new Logger(DiveSiteReviewEventListener.name);

  constructor(
    @InjectRepository(DiveSiteEntity)
    private readonly DiveSites: Repository<DiveSiteEntity>,
  ) {}

  private async updateAggregates(siteId: string): Promise<void> {
    try {
      const aggregates: {
        averageRating: number | null;
        averageDifficulty: number | null;
      }[] = await this.DiveSites.query(
        'SELECT AVG("rating") AS "averageRating", AVG("difficulty") AS "averageDifficulty" FROM dive_site_reviews WHERE "siteId" = $1 GROUP BY "siteId"',
        [siteId],
      );

      if (aggregates[0]) {
        this.log.debug(
          `Calculated aggregates: Rating = ${aggregates[0].averageRating}, Difficulty = ${aggregates[0].averageDifficulty}`,
          aggregates,
        );

        await this.DiveSites.update(
          { id: siteId },
          {
            averageDifficulty: aggregates[0].averageDifficulty,
            averageRating: aggregates[0].averageRating,
          },
        );
      } else {
        this.log.debug(
          `No reviews found while updating aggregates for site ${siteId}.`,
        );
        await this.DiveSites.update(
          { id: siteId },
          { averageRating: null, averageDifficulty: null },
        );
      }
    } catch (error) {
      this.log.error(`Failed to update aggregates for site ${siteId}.`, error);
    }
  }

  @OnEvent(DiveSite_ReviewSaved, { async: true })
  async handleReviewSavedEvent(event: DiveSiteReviewSavedEvent): Promise<void> {
    this.log.debug(
      `Received event: ${DiveSite_ReviewSaved.description}`,
      event,
    );
    await this.updateAggregates(event.siteId);
  }

  @OnEvent(DiveSite_ReviewSaved, { async: true })
  async handleReviewDeletedEvent(
    event: DiveSiteReviewDeletedEvent,
  ): Promise<void> {
    this.log.debug(
      `Received event: ${DiveSite_ReviewDeleted.description}`,
      event,
    );
    await this.updateAggregates(event.siteId);
  }
}
