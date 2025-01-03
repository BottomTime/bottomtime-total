import { OperatorReviewDTO, SuccinctProfileDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { OperatorReviewEntity } from '../data';

export class OperatorReview {
  constructor(
    private readonly reviews: Repository<OperatorReviewEntity>,
    private readonly data: OperatorReviewEntity,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get creator(): SuccinctProfileDTO {
    return {
      accountTier: this.data.creator.accountTier,
      logBookSharing: this.data.creator.logBookSharing,
      memberSince: this.data.creator.memberSince.valueOf(),
      userId: this.data.creator.id,
      username: this.data.creator.username,
      avatar: this.data.creator.avatar ?? undefined,
      name: this.data.creator.name ?? undefined,
      location: this.data.creator.location ?? undefined,
    };
  }

  get comments(): string | undefined {
    return this.data.comments ?? undefined;
  }
  set comments(val: string | undefined) {
    this.data.comments = val || null;
  }

  get rating(): number {
    return this.data.rating;
  }
  set rating(val: number) {
    this.data.rating = val;
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.reviews.delete(this.id);
    return affected === 1;
  }

  async save(): Promise<void> {
    this.data.updatedAt = new Date();
    await this.reviews.save(this.data);
  }

  toJSON(): OperatorReviewDTO {
    return {
      createdAt: this.createdAt.valueOf(),
      creator: this.creator,
      comments: this.comments,
      id: this.id,
      rating: this.rating,
      updatedAt: this.updatedAt.valueOf(),
    };
  }
}
