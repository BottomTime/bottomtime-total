import { SuccinctProfileDTO, TankDTO, TankMaterial } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { TankEntity } from '../data';

export class Tank {
  constructor(
    private readonly Tanks: Repository<TankEntity>,

    private readonly data: TankEntity,
  ) {}

  get id(): string {
    return this.data.id;
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

  get user(): SuccinctProfileDTO | null {
    return this.data.user
      ? {
          accountTier: this.data.user.accountTier,
          memberSince: this.data.user.memberSince,
          userId: this.data.user.id,
          username: this.data.user.username,
          logBookSharing: this.data.user.logBookSharing,
          avatar: this.data.user.avatar,
          name: this.data.user.name,
          location: this.data.user.location,
        }
      : null;
  }

  get isSystem(): boolean {
    if (this.data.user) return false;
    return true;
  }

  async save(): Promise<void> {
    await this.Tanks.save(this.data);
  }

  async delete(): Promise<boolean> {
    const { affected } = await this.Tanks.delete({ id: this.id });
    return !!affected && affected > 0;
  }

  toJSON(): TankDTO {
    return {
      id: this.id,
      material: this.material,
      name: this.name,
      volume: this.volume,
      workingPressure: this.workingPressure,
      isSystem: this.isSystem,
    };
  }
}
