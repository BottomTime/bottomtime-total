import {
  CreateOrUpdateFeatureSchema,
  FeatureDTO,
  FeatureSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class Feature {
  constructor(
    private readonly client: Fetcher,
    private readonly data: FeatureDTO,
  ) {}

  get key(): string {
    return this.data.key;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  get name(): string {
    return this.data.name;
  }
  set name(name: string) {
    this.data.name = name;
  }

  get description(): string | undefined {
    return this.data.description;
  }
  set description(description: string | undefined) {
    this.data.description = description;
  }

  get enabled(): boolean {
    return this.data.enabled;
  }
  set enabled(enabled: boolean) {
    this.data.enabled = enabled;
  }

  async save(): Promise<void> {
    await this.client.put<FeatureDTO>(
      `/api/features/${this.data.key}`,
      CreateOrUpdateFeatureSchema.parse(this.data),
      FeatureSchema,
    );

    this.data.updatedAt = new Date();
  }

  async delete(): Promise<void> {
    await this.client.delete(`/api/features/${this.data.key}`);
  }

  toJSON(): FeatureDTO {
    return { ...this.data };
  }
}
