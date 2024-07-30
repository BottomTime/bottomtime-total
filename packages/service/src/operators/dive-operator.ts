import {
  DiveOperatorDTO,
  GpsCoordinates,
  LogBookSharing,
  SuccinctDiveOperatorDTO,
  SuccinctProfileDTO,
} from '@bottomtime/api';

import { ConflictException } from '@nestjs/common';

import { DiveOperatorEntity } from 'src/data';
import { Not, Repository } from 'typeorm';

import { User } from '../users';
import { DiveOperatorSocials } from './dive-operator-socials';

export class DiveOperator {
  readonly socials: DiveOperatorSocials;

  constructor(
    private readonly operators: Repository<DiveOperatorEntity>,
    private readonly data: DiveOperatorEntity,
  ) {
    this.socials = new DiveOperatorSocials(this.data);
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
          userId: this.data.owner.id,
          username: this.data.owner.username,
          memberSince: this.data.owner.memberSince,
          logBookSharing: this.data.owner.logBookSharing,
          avatar: this.data.owner.avatar,
          location: this.data.owner.location,
          name: this.data.owner.name,
        }
      : {
          userId: '',
          username: '',
          memberSince: new Date(0),
          logBookSharing: LogBookSharing.Private,
        };
  }

  get verified(): boolean {
    return this.data.verified;
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
    return this.data.slug;
  }
  set slug(value: string) {
    this.data.slug = value.toLowerCase();
  }

  get description(): string | undefined {
    return this.data.description ?? undefined;
  }
  set description(value: string | undefined) {
    this.data.description = value ?? null;
  }

  get address(): string | undefined {
    return this.data.address ?? undefined;
  }
  set address(value: string | undefined) {
    this.data.address = value ?? null;
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
    await this.operators.save(this.data);
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.operators.delete(this.data.id);
    return affected === 1;
  }

  async verify(): Promise<void> {
    this.data.verified = true;
    await this.save();
  }

  async unverify(): Promise<void> {
    this.data.verified = false;
    await this.save();
  }

  async transferOwnership(newOwner: User): Promise<void> {
    this.data.owner = newOwner.toEntity();
    await this.save();
  }

  toJSON(): DiveOperatorDTO {
    return {
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
      verified: this.verified,
      website: this.website,
    };
  }

  toSuccinctJSON(): SuccinctDiveOperatorDTO {
    return {
      address: this.address,
      description: this.description,
      email: this.email,
      gps: this.gps,
      id: this.id,
      logo: this.logo,
      name: this.name,
      phone: this.phone,
      socials: this.socials.toJSON(),
      verified: this.verified,
      website: this.website,
    };
  }

  toEntity(): DiveOperatorEntity {
    return { ...this.data };
  }
}
