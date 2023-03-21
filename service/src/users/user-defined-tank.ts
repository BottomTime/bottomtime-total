import Logger from 'bunyan';
import { Collection, MongoClient } from 'mongodb';

import { Collections, UserDocument } from '../data';
import { Tank } from '../tanks';
import { UserDefinedTankSubDocument } from '../data';

export class UserDefinedTank implements Tank {
  private readonly users: Collection<UserDocument>;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly userData: UserDocument,
    private readonly tankData: UserDefinedTankSubDocument,
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

  get material(): string {
    return this.tankData.material;
  }
  set material(value: string) {
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

  async save(): Promise<void> {}

  toJSON(): Record<string, unknown> {
    return {};
  }
}
