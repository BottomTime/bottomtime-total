import {
  AccountTier,
  ApiList,
  CreateOrUpdateOperatorReviewDTO,
  GpsCoordinates,
  ListOperatorReviewsParams,
  LogBookSharing,
  OperatorDTO,
  SuccinctProfileDTO,
  VerificationStatus,
} from '@bottomtime/api';

import { ConflictException, HttpException } from '@nestjs/common';

import { MoreThan, Not, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { OperatorEntity, OperatorReviewEntity } from '../data';
import { User } from '../users';
import { OperatorReview } from './operator-review';
import { OperatorReviewQueryBuilder } from './operator-review-query-builder';
import { OperatorSocials } from './operator-socials';

export type ListOperatorReviewsOptions = {
  creator?: User;
} & Omit<ListOperatorReviewsParams, 'creator'>;

export type CreateOperatorReviewOptions = {
  creator: User;
} & CreateOrUpdateOperatorReviewDTO;

export class Operator {
  readonly socials: OperatorSocials;
  private newSlug: string | undefined;

  constructor(
    private readonly operators: Repository<OperatorEntity>,
    private readonly reviews: Repository<OperatorReviewEntity>,
    private readonly data: OperatorEntity,
  ) {
    this.socials = new OperatorSocials(this.data);
  }

  get id(): string {
    return this.data.id;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get owner(): SuccinctProfileDTO {
    return this.data.owner
      ? {
          accountTier: this.data.owner.accountTier,
          userId: this.data.owner.id,
          username: this.data.owner.username,
          memberSince: this.data.owner.memberSince.valueOf(),
          logBookSharing: this.data.owner.logBookSharing,
          avatar: this.data.owner.avatar,
          location: this.data.owner.location,
          name: this.data.owner.name,
        }
      : {
          accountTier: AccountTier.Basic,
          userId: '',
          username: '',
          memberSince: new Date(0).valueOf(),
          logBookSharing: LogBookSharing.Private,
        };
  }

  get averageRating(): number | undefined {
    return this.data.averageRating ?? undefined;
  }

  get verificationStatus(): VerificationStatus {
    return this.data.verificationStatus;
  }

  get verificationMessage(): string | undefined {
    return this.data.verificationMessage ?? undefined;
  }

  get active(): boolean {
    return this.data.active;
  }
  set active(value: boolean) {
    this.data.active = value;
  }

  get logo(): string | undefined {
    return this.data.logo ?? undefined;
  }
  set logo(value: string | undefined) {
    this.data.logo = value ?? null;
  }

  get banner(): string | undefined {
    return this.data.banner ?? undefined;
  }
  set banner(value: string | undefined) {
    this.data.banner = value ?? null;
  }

  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
  }

  get slug(): string {
    return this.newSlug || this.data.slug;
  }
  set slug(value: string) {
    this.newSlug = value.trim().toLowerCase();
  }

  get description(): string {
    return this.data.description ?? '';
  }
  set description(value: string) {
    this.data.description = value;
  }

  get address(): string {
    return this.data.address ?? '';
  }
  set address(value: string) {
    this.data.address = value;
  }

  get phone(): string | undefined {
    return this.data.phone ?? undefined;
  }
  set phone(value: string | undefined) {
    this.data.phone = value ?? null;
  }

  get email(): string | undefined {
    return this.data.email ?? undefined;
  }
  set email(value: string | undefined) {
    this.data.email = value ?? null;
  }

  get website(): string | undefined {
    return this.data.website ?? undefined;
  }
  set website(value: string | undefined) {
    this.data.website = value ?? null;
  }

  get gps(): GpsCoordinates | undefined {
    return this.data.gps
      ? { lat: this.data.gps.coordinates[1], lon: this.data.gps.coordinates[0] }
      : undefined;
  }
  set gps(value: GpsCoordinates | undefined) {
    this.data.gps = value
      ? {
          type: 'Point',
          coordinates: [value.lon, value.lat],
        }
      : null;
  }

  async save(): Promise<void> {
    const conflict = await this.operators.existsBy({
      id: Not(this.id),
      slug: this.slug,
    });
    if (conflict) {
      throw new ConflictException(
        `Unable to save "${this.name}". Slug is already in use (${this.slug}).`,
      );
    }

    this.data.updatedAt = new Date();
    await this.operators.save({
      ...this.data,
      slug: this.newSlug || this.data.slug,
    });

    if (this.newSlug) {
      this.data.slug = this.newSlug;
      this.newSlug = undefined;

      // If a logo URL exists and points to our local API endpoint, then the logo URL also needs to be updated when the slug changes.
      if (this.data.logo && /^\/api\/operators\/.*/.test(this.data.logo)) {
        const newLogo = `/api/operators/${this.data.slug}/logo`;
        await this.operators.update({ id: this.data.id }, { logo: newLogo });
        this.data.logo = newLogo;
      }
    }
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.operators.softDelete(this.data.id);
    return affected === 1;
  }

  async requestVerification(): Promise<void> {
    this.data.verificationStatus = VerificationStatus.Pending;
    this.data.updatedAt = new Date();
    await this.save();
  }

  async setVerification(verified: boolean, message?: string): Promise<void> {
    this.data.verificationStatus = verified
      ? VerificationStatus.Verified
      : VerificationStatus.Rejected;
    this.data.verificationMessage = message ?? null;
    this.data.updatedAt = new Date();
    await this.save();
  }

  async transferOwnership(newOwner: User): Promise<void> {
    this.data.owner = newOwner.toEntity();
    await this.save();
  }

  async setLogoUrl(logoUrl: string | null): Promise<void> {
    await this.operators.update({ id: this.data.id }, { logo: logoUrl });
    this.data.logo = logoUrl;
  }

  async getReview(reviewId: string): Promise<OperatorReview | undefined> {
    const data = await this.reviews.findOne({
      where: { operator: { id: this.data.id }, id: reviewId },
      relations: ['creator'],
    });

    if (data) {
      return new OperatorReview(this.reviews, data);
    }

    return undefined;
  }

  async listReviews(
    options?: ListOperatorReviewsOptions,
  ): Promise<ApiList<OperatorReview>> {
    const query = new OperatorReviewQueryBuilder(this.reviews)
      .withOperator(this)
      .withCreator(options?.creator)
      .withQuery(options?.query)
      .withPagination(options?.skip, options?.limit)
      .withSortOrder(options?.sortBy, options?.sortOrder)
      .build();

    const [data, totalCount] = await query.getManyAndCount();

    return {
      data: data.map((review) => new OperatorReview(this.reviews, review)),
      totalCount,
    };
  }

  async createReview(
    options: CreateOperatorReviewOptions,
  ): Promise<OperatorReview> {
    const existing = await this.reviews.existsBy({
      operator: { id: this.data.id },
      creator: { id: options.creator.id },
      createdAt: MoreThan(new Date(Date.now() - 1000 * 60 * 60 * 48)),
    });
    if (existing) {
      throw new HttpException(
        'You may not review the same operator twice in the same 48 hour period.',
        429,
      );
    }

    const data = new OperatorReviewEntity();
    data.id = uuid();
    data.creator = options.creator.toEntity();
    data.operator = this.data;

    const review = new OperatorReview(this.reviews, data);
    review.comments = options.comments;
    review.rating = options.rating;

    await review.save();
    return review;
  }

  toJSON(): OperatorDTO {
    return {
      active: this.active,
      createdAt: this.createdAt.valueOf(),
      description: this.description,
      email: this.email,
      gps: this.gps,
      id: this.id,
      name: this.name,
      owner: this.owner,
      socials: this.socials.toJSON(),
      updatedAt: this.updatedAt.valueOf(),
      address: this.address,
      banner: this.banner,
      logo: this.logo,
      phone: this.phone,
      slug: this.slug,
      verificationStatus: this.verificationStatus,
      verificationMessage: this.verificationMessage,
      website: this.website,
    };
  }

  toEntity(): OperatorEntity {
    return { ...this.data };
  }
}
