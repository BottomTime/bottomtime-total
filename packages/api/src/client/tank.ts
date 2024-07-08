import {
  CreateOrUpdateTankParamsSchema,
  TankDTO,
  TankMaterial,
} from '../types';
import { Fetcher } from './fetcher';

export class Tank {
  constructor(
    private readonly apiClient: Fetcher,
    private data: TankDTO,
    private readonly ownerUsername?: string,
  ) {}

  private getUrl(): string {
    return this.ownerUsername
      ? `/api/users/${this.ownerUsername}/tanks/${this.data.id}`
      : `/api/admin/tanks/${this.data.id}`;
  }

  get id(): string {
    return this.data.id;
  }

  get owner(): string | undefined {
    return this.ownerUsername;
  }

  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
  }

  get material(): TankMaterial {
    return this.data.material;
  }
  set material(value: TankMaterial) {
    this.data.material = value;
  }

  get volume(): number {
    return this.data.volume;
  }
  set volume(value: number) {
    this.data.volume = value;
  }

  get workingPressure(): number {
    return this.data.workingPressure;
  }
  set workingPressure(value: number) {
    this.data.workingPressure = value;
  }

  toJSON(): TankDTO {
    return { ...this.data };
  }

  async save(): Promise<void> {
    const { data } = await this.apiClient.put<TankDTO>(
      this.getUrl(),
      CreateOrUpdateTankParamsSchema.parse(this.data),
    );
    this.data = data;
  }

  async delete(): Promise<void> {
    await this.apiClient.delete(this.getUrl());
  }
}
