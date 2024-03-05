import { TankDTO, TankMaterial } from '@bottomtime/api';

import { TankDocument } from '../schemas';

export class Tank {
  constructor(private readonly data: TankDocument) {}

  get id(): string {
    return this.data._id;
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

  get userId(): string | null {
    // return this.data.user;
    return '';
  }

  get isSystem(): boolean {
    return !this.userId;
  }

  async save(): Promise<void> {
    await this.data.save();
  }

  async delete(): Promise<boolean> {
    const { deletedCount } = await this.data.deleteOne();
    return deletedCount > 0;
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
