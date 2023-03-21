import Logger from 'bunyan';
import { Collection, MongoClient } from 'mongodb';

import { Collections } from '../data';
import { Tank } from './interfaces';
import { TankDocument } from '../data/tank-document';
import { assertValid } from '../helpers/validation';
import { TankSchema } from './validation';

export class PreDefinedTank implements Tank {
  private readonly tanks: Collection<TankDocument>;
  readonly preDefined = true;
  readonly owner = undefined;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: TankDocument,
  ) {
    this.tanks = mongoClient.db().collection(Collections.Tanks);
  }

  get id(): string {
    return this.data._id;
  }

  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
  }

  get material(): string {
    return this.data.material;
  }
  set material(value: string) {
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

  async delete(): Promise<void> {
    this.log.debug(`Deleting tank "${this.data.name}"...`);
    await this.tanks.deleteOne({ _id: this.data._id });
  }

  async save(): Promise<void> {
    const { parsed } = assertValid(this.data, TankSchema);

    this.log.debug(`Saving changes to tank "${this.data.name}"...`);
    await this.tanks.updateOne(
      {
        _id: this.id,
      },
      {
        $set: {
          name: parsed.name,
          material: parsed.material,
          volume: parsed.volume,
          workingPressure: parsed.workingPressure,
        },
      },
      {
        upsert: true,
      },
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      preDefined: this.preDefined,
      owner: this.owner,
      name: this.name,
      material: this.material,
      volume: this.volume,
      workingPressure: this.workingPressure,
    };
  }
}
