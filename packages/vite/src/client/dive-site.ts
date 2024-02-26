import {
  CreateOrUpdateDiveSiteSchema,
  DepthDTO,
  DiveSiteDTO,
  ProfileDTO,
} from '@bottomtime/api';

import { AxiosInstance } from 'axios';

export type GPSCoordinates = DiveSiteDTO['gps'];

export class DiveSite {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: DiveSiteDTO,
  ) {}

  // READONLY METADATA
  get id(): string {
    return this.data.id;
  }

  get creator(): Readonly<ProfileDTO> {
    return this.data.creator;
  }

  get createdOn(): Date {
    return this.data.createdOn;
  }

  get updatedOn(): Date | undefined {
    return this.data.updatedOn;
  }

  get averageRating(): number | undefined {
    return this.data.averageRating;
  }

  get averageDifficulty(): number | undefined {
    return this.data.averageDifficulty;
  }

  // EDITABLE PROPERTIES
  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
  }

  get description(): string | undefined {
    return this.data.description;
  }
  set description(value: string | undefined) {
    this.data.description = value;
  }

  get depth(): DepthDTO | undefined {
    return this.data.depth;
  }
  set depth(value: DepthDTO | undefined) {
    this.data.depth = value;
  }

  get location(): string {
    return this.data.location;
  }
  set location(value: string) {
    this.data.location = value;
  }

  get directions(): string | undefined {
    return this.data.directions;
  }
  set directions(value: string | undefined) {
    this.data.directions = value;
  }

  get gps(): GPSCoordinates | undefined {
    return this.data.gps;
  }
  set gps(value: GPSCoordinates | undefined) {
    this.data.gps = value;
  }

  get freeToDive(): boolean | undefined {
    return this.data.freeToDive;
  }
  set freeToDive(value: boolean | undefined) {
    this.data.freeToDive = value;
  }

  get shoreAccess(): boolean | undefined {
    return this.data.shoreAccess;
  }
  set shoreAccess(value: boolean | undefined) {
    this.data.shoreAccess = value;
  }

  async save(): Promise<void> {
    const params = CreateOrUpdateDiveSiteSchema.parse(this.data);
    await this.client.put(`/api/diveSites/${this.id}`, params);
  }

  toJSON(): DiveSiteDTO {
    return { ...this.data };
  }
}
