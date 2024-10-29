import {
  AccountTier,
  GpsCoordinates,
  LogBookSharing,
  OperatorDTO,
  SuccinctProfileDTO,
  VerificationStatus,
} from '@bottomtime/api';

import { ConflictException } from '@nestjs/common';

import { Not, Repository } from 'typeorm';

import { OperatorEntity } from '../data';
import { User } from '../users';
import { OperatorSocials } from './operator-socials';

export class Operator {
  readonly socials: OperatorSocials;
  private newSlug: string | undefined;

  constructor(
    private readonly operators: Repository<OperatorEntity>,
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
          memberSince: this.data.owner.memberSince,
          logBookSharing: this.data.owner.logBookSharing,
          avatar: this.data.owner.avatar,
          location: this.data.owner.location,
          name: this.data.owner.name,
        }
      : {
          accountTier: AccountTier.Basic,
          userId: '',
          username: '',
          memberSince: new Date(0),
          logBookSharing: LogBookSharing.Private,
        };
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

  toJSON(): OperatorDTO {
    return {
      active: this.active,
      createdAt: this.createdAt,
      description: this.description,
      email: this.email,
      gps: this.gps,
      id: this.id,
      name: this.name,
      owner: this.owner,
      socials: this.socials.toJSON(),
      updatedAt: this.updatedAt,
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
