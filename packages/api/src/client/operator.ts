import {
  CreateOrUpdateOperatorSchema,
  ImageBoundaryDTO,
  ListAvatarURLsResponseDTO,
  OperatorDTO,
  OperatorSchema,
  SuccinctProfileDTO,
  VerificationStatus,
} from '../types';
import { GPSCoordinates } from './dive-site';
import { Fetcher } from './fetcher';

export class Operator {
  private newSlug: string | undefined;

  constructor(
    private readonly client: Fetcher,
    private readonly data: OperatorDTO,
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

  get verificationStatus(): VerificationStatus {
    return this.data.verificationStatus;
  }

  get verificationMessage(): string | undefined {
    return this.data.verificationMessage;
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

  get active(): boolean {
    return this.data.active;
  }
  set active(value: boolean) {
    this.data.active = value;
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

  get socials(): OperatorDTO['socials'] {
    return this.data.socials;
  }
  set socials(value: OperatorDTO['socials']) {
    this.data.socials = value;
  }

  toJSON(): OperatorDTO {
    return { ...this.data };
  }

  async save(): Promise<void> {
    await this.client.put(
      `/api/operators/${this.data.slug}`,
      CreateOrUpdateOperatorSchema.parse({
        ...this.data,
        slug: this.slug,
      }),
      OperatorSchema,
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
      OperatorSchema,
    );

    this.data.updatedAt = data.updatedAt;
    this.data.owner = data.owner;
  }

  async requestVerification(): Promise<void> {
    await this.client.post(`/api/operators/${this.slug}/requestVerification`);
    this.data.verificationStatus = VerificationStatus.Pending;
    this.data.updatedAt = new Date();
  }

  async setVerified(verified: boolean, message?: string): Promise<void> {
    await this.client.post(`/api/operators/${this.slug}/verify`, {
      verified,
      message,
    });
    this.data.verificationStatus = verified
      ? VerificationStatus.Verified
      : VerificationStatus.Rejected;
    this.data.verificationMessage = message;
    this.data.updatedAt = new Date();
  }

  async uploadLogo(
    logo: File,
    region?: ImageBoundaryDTO,
  ): Promise<ListAvatarURLsResponseDTO> {
    const formData = new FormData();
    formData.append('logo', logo);

    if (region && 'left' in region) {
      formData.append('left', region.left.toString());
      formData.append('top', region.top.toString());
      formData.append('width', region.width.toString());
      formData.append('height', region.height.toString());
    }

    const { data } = await this.client.postFormData<ListAvatarURLsResponseDTO>(
      `api/operators/${this.data.slug}/logo`,
      formData,
    );

    return data;
  }

  async deleteLogo(): Promise<void> {
    await this.client.delete(`/api/operators/${this.slug}/logo`);
  }
}
