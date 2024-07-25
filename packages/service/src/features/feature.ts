import { Repository } from 'typeorm';

import { FeatureEntity } from '../data';

export class Feature {
  constructor(
    private readonly features: Repository<FeatureEntity>,
    private readonly data: FeatureEntity,
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
  set name(value: string) {
    this.data.name = value;
  }

  get description(): string | undefined {
    return this.data.description ?? undefined;
  }
  set description(value: string | undefined) {
    this.data.description = value ?? null;
  }

  get enabled(): boolean {
    return this.data.enabled;
  }
  set enabled(value: boolean) {
    this.data.enabled = value;
  }

  async save(): Promise<void> {
    this.data.updatedAt = new Date();
    await this.features.save(this.data);
  }

  async delete(): Promise<void> {
    await this.features.delete({ id: this.data.id });
  }

  toJSON() {
    return {
      key: this.key,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      name: this.name,
      description: this.description,
      enabled: this.enabled,
    };
  }
}
