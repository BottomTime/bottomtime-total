import { Collection, MongoClient } from 'mongodb';
import Logger from 'bunyan';

import { Collections, UserDocument } from '../data';
import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  WeightUnit,
} from '../constants';
import { UserSettings } from './interfaces';
import { assertValid } from '../helpers/validation';
import { UserSettingsSchema } from './validation';

export class DefaultUserSettings implements UserSettings {
  private readonly users: Collection<UserDocument>;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: UserDocument,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
    if (!data.settings) {
      this.data.settings = {};
    }
  }

  get depthUnit(): string {
    return this.data.settings?.depthUnit ?? DepthUnit.Meters;
  }
  set depthUnit(value: string) {
    this.data.settings!.depthUnit = value;
  }

  get pressureUnit(): string {
    return this.data.settings?.pressureUnit ?? PressureUnit.Bar;
  }
  set pressureUnit(value: string) {
    this.data.settings!.pressureUnit = value;
  }

  get temperatureUnit(): string {
    return this.data.settings?.temperatureUnit ?? TemperatureUnit.Celsius;
  }
  set temperatureUnit(value: string) {
    this.data.settings!.temperatureUnit = value;
  }

  get weightUnit(): string {
    return this.data.settings?.weightUnit ?? WeightUnit.Kilograms;
  }
  set weightUnit(value: string) {
    this.data.settings!.weightUnit = value;
  }

  async save(): Promise<void> {
    const { parsed: settings } = assertValid(
      this.data.settings,
      UserSettingsSchema,
    );

    this.log.debug(
      `Attempting to save profile settings for user "${this.data.username}...`,
    );

    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          settings,
        },
      },
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      depthUnit: this.depthUnit,
      pressureUnit: this.pressureUnit,
      temperatureUnit: this.temperatureUnit,
      weightUnit: this.weightUnit,
    };
  }
}
