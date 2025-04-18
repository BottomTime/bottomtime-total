import { DiveSiteReviewDTO, SuccinctProfileDTO } from '@bottomtime/api';

import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Repository } from 'typeorm';

import { DiveSiteReviewEntity, LogEntryEntity } from '../data';
import {
  DiveSite_ReviewDeleted,
  DiveSite_ReviewSaved,
} from './dive-site-review.event';

export class DiveSiteReview {
  private readonly log = new Logger(DiveSiteReview.name);

  constructor(
    private readonly Reviews: Repository<DiveSiteReviewEntity>,
    private readonly emitter: EventEmitter2,
    private readonly data: DiveSiteReviewEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get creator(): SuccinctProfileDTO {
    return {
      accountTier: this.data.creator.accountTier,
      memberSince: this.data.creator.memberSince.valueOf(),
      userId: this.data.creator.id,
      username: this.data.creator.username,
      logBookSharing: this.data.creator.logBookSharing,
      name: this.data.creator.name,
      avatar: this.data.creator.avatar,
      location: this.data.creator.location,
    };
  }

  get createdOn(): Date {
    return this.data.createdOn ?? new Date();
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn ?? undefined;
  }

  get rating(): number {
    return this.data.rating;
  }
  set rating(value: number) {
    this.data.rating = value;
  }

  get difficulty(): number | undefined {
    return this.data.difficulty ?? undefined;
  }
  set difficulty(value: number | undefined) {
    this.data.difficulty = value ?? null;
  }

  get comments(): string | undefined {
    return this.data.comments ?? undefined;
  }
  set comments(value: string | undefined) {
    this.data.comments = value ?? null;
  }

  get logEntryId(): string | undefined {
    return this.data.logEntry?.id;
  }
  set logEntryId(value: string | undefined) {
    this.data.logEntry = value ? ({ id: value } as LogEntryEntity) : null;
  }

  async save(): Promise<void> {
    if (this.data.createdOn === undefined) this.data.createdOn = new Date();
    else this.data.updatedOn = new Date();

    this.log.debug(
      `Attempting to save dive site review with ID "${this.data.id}"...`,
    );
    await this.Reviews.save(this.data);

    this.emitter.emit(DiveSite_ReviewSaved, {
      reviewId: this.data.id,
      siteId: this.data.site.id,
      rating: this.data.rating,
      difficulty: this.data.difficulty,
    });
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.Reviews.delete(this.data.id);

    if (affected === 1) {
      this.emitter.emit(DiveSite_ReviewDeleted, {
        reviewId: this.data.id,
        siteId: this.data.site.id,
      });
      return true;
    }

    return false;
  }

  toJSON(): DiveSiteReviewDTO {
    return {
      id: this.id,
      creator: this.creator,
      createdOn: this.createdOn.valueOf(),
      updatedOn: this.updatedOn?.valueOf(),
      rating: this.rating,
      difficulty: this.difficulty,
      comments: this.comments,
    };
  }
}
