import { AxiosInstance } from 'axios';

import { TankDTO, TankMaterial } from '../types';

export class Tank {
  constructor(
    private readonly client: AxiosInstance,
    private readonly username: string | undefined,
    private readonly data: TankDTO,
  ) {}

  private getUrl(): string {
    return this.username
      ? `/api/users/${this.username}/tanks/${this.id}`
      : `/api/admin/tanks/${this.id}`;
  }

  get id(): string {
    return this.data.id;
  }

  get isSystem(): boolean {
    return this.data.isSystem;
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

  get workingPressure(): number {
    return this.data.workingPressure;
  }
  set workingPressure(value: number) {
    this.data.workingPressure = value;
  }

  get volume(): number {
    return this.data.volume;
  }
  set volume(value: number) {
    this.data.volume = value;
  }

  toJSON(): TankDTO {
    return { ...this.data };
  }

  async save(): Promise<void> {
    await this.client.put(this.getUrl(), this.data);
  }

  async delete(): Promise<void> {
    await this.client.delete(this.getUrl());
  }
}
