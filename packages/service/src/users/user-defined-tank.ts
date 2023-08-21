import Logger from 'bunyan';
import { Collection, MongoClient } from 'mongodb';

import { Collections, TankSchema, UserDocument } from '../data';
import { Tank } from '../tanks';
import { UserDefinedTankDocument } from '../data';
import { TankMaterial } from '../constants';
import { assertValid } from '../helpers/validation';

export class UserDefinedTank implements Tank {
  private readonly users: Collection<UserDocument>;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly userData: UserDocument,
    private readonly tankData: UserDefinedTankDocument,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
  }

  readonly preDefined = false;

  get id(): string {
    return this.tankData._id;
  }

  get owner(): string {
    return this.userData.username;
  }

  get name(): string {
    return this.tankData.name;
  }
  set name(value: string) {
    this.tankData.name = value;
  }

  get material(): TankMaterial {
    return this.tankData.material;
  }
  set material(value: TankMaterial) {
    this.tankData.material = value;
  }

  get volume(): number {
    return this.tankData.volume;
  }
  set volume(value: number) {
    this.tankData.volume = value;
  }

  get workingPressure(): number {
    return this.tankData.workingPressure;
  }
  set workingPressure(value: number) {
    this.tankData.workingPressure = value;
  }

  async delete(): Promise<void> {}

  async save(): Promise<void> {
    assertValid(this.tankData, TankSchema);
  }

  toJSON(): Record<string, unknown> {
    return {};
  }
}
