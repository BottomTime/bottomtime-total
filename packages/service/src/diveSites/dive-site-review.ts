import { DiveSiteReviewDTO, SuccinctProfileDTO } from '@bottomtime/api';

import { Logger } from '@nestjs/common';

import { Repository } from 'typeorm';

import { DiveSiteReviewEntity } from '../data';

export class DiveSiteReview {
  private readonly log = new Logger(DiveSiteReview.name);

  constructor(
    private readonly Reviews: Repository<DiveSiteReviewEntity>,
    private readonly data: DiveSiteReviewEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get creator(): SuccinctProfileDTO {
    return {
      memberSince: this.data.creator.memberSince,
      userId: this.data.creator.id,
      username: this.data.creator.username,
      avatar: this.data.creator.avatar,
      location: this.data.creator.location,
      name: this.data.creator.name,
    };
  }

  get createdOn(): Date {
    return this.data.createdOn ?? new Date();
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn ?? undefined;
  }

  get title(): string {
    return this.data.title;
  }
  set title(value: string) {
    this.data.title = value;
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

  async save(): Promise<void> {
    if (this.data.createdOn === undefined) this.data.createdOn = new Date();
    else this.data.updatedOn = new Date();

    this.log.debug(
      `Attempting to save dive site review with ID "${this.data.id}"...`,
    );
    await this.Reviews.save(this.data);
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.Reviews.delete(this.data.id);
    return affected === 1;
  }

  toJSON(): DiveSiteReviewDTO {
    return {
      id: this.id,
      creator: this.creator,
      createdOn: this.createdOn,
      updatedOn: this.updatedOn,
      title: this.title,
      rating: this.rating,
      difficulty: this.difficulty,
      comments: this.comments,
    };
  }
}
