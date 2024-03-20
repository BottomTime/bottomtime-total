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
    const aggregates: {
      averageRating: number | null;
      averageDifficulty: number | null;
    } = await this.DiveSites.query(
      'SELECT avg("rating") AS "averageRating", avg("difficulty") AS "averageDifficulty" FROM dive_site_reviews WHERE "siteId" = $1 GROUP BY "siteId"',
      [siteId],
    );

    await this.DiveSites.update(siteId, { ...aggregates });
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
