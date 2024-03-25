import {
  CreateOrUpdateDiveSiteReviewDTO,
  DiveSiteDTO,
  ListDiveSiteReviewsParamsDTO,
  SortOrder,
  SuccinctProfileDTO,
} from '@bottomtime/api';

import { HttpException, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import dayjs from 'dayjs';
import { MoreThan, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { AnonymousUserProfile, Depth, GpsCoordinates } from '../common';
import { DiveSiteEntity, DiveSiteReviewEntity, UserEntity } from '../data';
import { DiveSiteReview } from './dive-site-review';

export type GPSCoordinates = NonNullable<DiveSiteDTO['gps']>;

export type ListReviewsResult = {
  reviews: DiveSiteReview[];
  totalCount: number;
};

export type CreateDiveSiteReviewOptions = CreateOrUpdateDiveSiteReviewDTO & {
  creatorId: string;
};

export class DiveSite {
  private readonly log = new Logger(DiveSite.name);

  constructor(
    private readonly Users: Repository<UserEntity>,
    private readonly DiveSites: Repository<DiveSiteEntity>,
    private readonly Reviews: Repository<DiveSiteReviewEntity>,
    private readonly emitter: EventEmitter2,
    private readonly data: DiveSiteEntity,
  ) {}

  // READ-ONLY METADATA
  get id(): string {
    return this.data.id;
  }

  get createdOn(): Date {
    return this.data.createdOn;
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn ?? undefined;
  }

  get creator(): SuccinctProfileDTO {
    if (!this.data.creator) {
      // Populate failed. The user record is missing. This should never happen.
      return AnonymousUserProfile;
    }

    return {
      userId: this.data.creator.id,
      username: this.data.creator.username,
      memberSince: this.data.creator.memberSince,
      avatar: this.data.creator.avatar,
      location: this.data.creator.location,
      name: this.data.creator.name,
    };
  }

  get averageRating(): number | undefined {
    return this.data.averageRating ?? undefined;
  }

  get averageDifficulty(): number | undefined {
    return this.data.averageDifficulty ?? undefined;
  }

  // BASIC INFO
  get name(): string {
    return this.data.name;
  }
  set name(val: string) {
    this.data.name = val;
  }

  get description(): string | undefined {
    return this.data.description || undefined;
  }
  set description(val: string | undefined) {
    this.data.description = val || null;
  }

  get depth(): Depth | undefined {
    return typeof this.data.depth === 'number' && this.data.depthUnit
      ? {
          depth: this.data.depth,
          unit: this.data.depthUnit,
        }
      : undefined;
  }
  set depth(val: Depth | undefined) {
    if (val) {
      this.data.depth = val.depth;
      this.data.depthUnit = val.unit;
    } else {
      this.data.depth = null;
      this.data.depthUnit = null;
    }
  }

  get freeToDive(): boolean | undefined {
    return this.data.freeToDive ?? undefined;
  }
  set freeToDive(val: boolean | undefined) {
    this.data.freeToDive = typeof val === 'boolean' ? val : null;
  }

  get shoreAccess(): boolean | undefined {
    return this.data.shoreAccess ?? undefined;
  }
  set shoreAccess(val: boolean | undefined) {
    this.data.shoreAccess = typeof val === 'boolean' ? val : null;
  }

  // LOCATION INFO
  get location(): string {
    return this.data.location;
  }
  set location(val: string) {
    this.data.location = val;
  }

  get directions(): string | undefined {
    return this.data.directions ?? undefined;
  }
  set directions(val: string | undefined) {
    this.data.directions = val || null;
  }

  get gps(): GpsCoordinates | undefined {
    if (this.data.gps) {
      return {
        lon: this.data.gps.coordinates[0],
        lat: this.data.gps.coordinates[1],
      };
    }

    return undefined;
  }
  set gps(val: GpsCoordinates | undefined) {
    if (val) {
      this.data.gps = {
        type: 'Point',
        coordinates: [val.lon, val.lat],
      };
    } else {
      this.data.gps = null;
    }
  }

  async save(): Promise<void> {
    this.data.updatedOn = new Date();
    await this.DiveSites.save(this.data);
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.DiveSites.delete({ id: this.id });
    return typeof affected === 'number' && affected > 0;
  }

  async createReview(
    options: CreateDiveSiteReviewOptions,
  ): Promise<DiveSiteReview> {
    const creator = await this.Users.findOneBy({ id: options.creatorId });

    if (!creator) {
      throw new NotFoundException(
        `Unable to find user with ID ${options.creatorId}`,
      );
    }

    // Users may not review the same site twice within 48 hours.
    const existingReview = await this.Reviews.existsBy({
      creator: { id: creator.id },
      site: { id: this.id },
      createdOn: MoreThan(dayjs().subtract(2, 'days').toDate()),
    });

    if (existingReview) {
      throw new HttpException(
        'You may not review the same site twice in the same 48 hour period.',
        429,
        { description: 'Rate limited' },
      );
    }

    const data = new DiveSiteReviewEntity();
    data.id = uuid();
    data.comments = options.comments ?? null;
    data.rating = options.rating;
    data.difficulty = options.difficulty ?? null;
    data.title = options.title;

    data.site = this.data;
    data.creator = creator;

    const review = new DiveSiteReview(this.Reviews, this.emitter, data);
    await review.save();

    return review;
  }

  async getReview(reviewId: string): Promise<DiveSiteReview | undefined> {
    const data = await this.Reviews.findOne({
      where: { id: reviewId, site: { id: this.data.id } },
      relations: ['creator'],
    });

    if (data) {
      data.site = this.data;
      return new DiveSiteReview(this.Reviews, this.emitter, data);
    }

    return undefined;
  }

  async listReviews(
    options: ListDiveSiteReviewsParamsDTO,
  ): Promise<ListReviewsResult> {
    const query = this.Reviews.createQueryBuilder('review')
      .innerJoin('review.creator', 'creator')
      .where('review.site = :siteId', { siteId: this.id })
      .addOrderBy(
        `review.${options.sortBy}`,
        options.sortOrder === SortOrder.Ascending ? 'ASC' : 'DESC',
      )
      .addOrderBy('review.title', 'ASC')
      .offset(options.skip)
      .limit(options.limit);

    this.log.debug(`Listing reviews for dive site ${this.id}...`);
    this.log.verbose(query.getSql());

    const [reviews, totalCount] = await query.getManyAndCount();

    return {
      reviews: reviews.map(
        (review) => new DiveSiteReview(this.Reviews, this.emitter, review),
      ),
      totalCount,
    };
  }

  toJSON(): DiveSiteDTO {
    return {
      id: this.id,
      creator: this.creator,
      createdOn: this.createdOn,
      updatedOn: this.updatedOn,
      name: this.name,
      description: this.description,
      depth: this.depth,
      location: this.location,
      directions: this.directions,
      gps: this.gps,
      freeToDive: this.freeToDive,
      shoreAccess: this.shoreAccess,
      averageRating: this.averageRating,
      averageDifficulty: this.averageDifficulty,
    };
  }
}
