import {
  CreateOrUpdateDiveOperatorSchema,
  DiveOperatorDTO,
  DiveOperatorSchema,
  SuccinctProfileDTO,
} from '../types';
import { GPSCoordinates } from './dive-site';
import { Fetcher } from './fetcher';

export class DiveOperator {
  private newSlug: string | undefined;

  constructor(
    private readonly client: Fetcher,
    private readonly data: DiveOperatorDTO,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get slug(): string {
    return this.newSlug || this.data.slug;
  }
  set slug(value: string) {
    this.newSlug = value;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get owner(): SuccinctProfileDTO {
    return this.data.owner;
  }

  get verified(): boolean {
    return this.data.verified;
  }

  get logo(): string | undefined {
    return this.data.logo;
  }

  get banner(): string | undefined {
    return this.data.banner;
  }

  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
  }

  get description(): string {
    return this.data.description;
  }
  set description(value: string) {
    this.data.description = value;
  }

  get address(): string {
    return this.data.address;
  }
  set address(value: string) {
    this.data.address = value;
  }

  get phone(): string | undefined {
    return this.data.phone;
  }
  set phone(value: string | undefined) {
    this.data.phone = value;
  }

  get email(): string | undefined {
    return this.data.email;
  }
  set email(value: string | undefined) {
    this.data.email = value;
  }

  get website(): string | undefined {
    return this.data.website;
  }
  set website(value: string | undefined) {
    this.data.website = value;
  }

  get gps(): GPSCoordinates | undefined {
    return this.data.gps;
  }
  set gps(value: GPSCoordinates | undefined) {
    this.data.gps = value;
  }

  get socials(): DiveOperatorDTO['socials'] {
    return this.data.socials;
  }
  set socials(value: DiveOperatorDTO['socials']) {
    this.data.socials = value;
  }

  toJSON(): DiveOperatorDTO {
    return { ...this.data };
  }

  async save(): Promise<void> {
    await this.client.put(
      `/api/operators/${this.data.slug}`,
      CreateOrUpdateDiveOperatorSchema.parse({
        ...this.data,
        slug: this.slug,
      }),
      DiveOperatorSchema,
    );

    if (this.newSlug) {
      this.data.slug = this.newSlug;
      this.newSlug = undefined;
    }

    this.data.slug = this.newSlug || this.data.slug;
    this.data.updatedAt = new Date();
    this.newSlug = undefined;
  }

  async delete(): Promise<void> {
    await this.client.delete(`/api/operators/${this.slug}`);
  }

  async transferOwnership(newOwner: string): Promise<void> {
    const { data } = await this.client.post(
      `/api/operators/${this.slug}/transfer`,
      { newOwner },
      DiveOperatorSchema,
    );

    this.data.updatedAt = data.updatedAt;
    this.data.owner = data.owner;
  }

  async setVerified(verified: boolean): Promise<void> {
    await this.client.post(`/api/operators/${this.slug}/verify`, { verified });
    this.data.verified = verified;
    this.data.updatedAt = new Date();
  }
}
