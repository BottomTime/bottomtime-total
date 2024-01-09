import { Collection, MongoClient } from 'mongodb';
import Logger from 'bunyan';

import {
  UserDocument,
  UserSettingsDocument,
  UserSettingsSchema,
} from '../data';
import { Collections } from '../schemas/collections';
import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  WeightUnit,
} from '../constants';
import { UserSettings } from './interfaces';
import { assertValid } from '../helpers/validation';

export class DefaultUserSettings implements UserSettings {
  private readonly users: Collection<UserDocument>;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: UserDocument,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
    if (!data.settings) {
      this.data.settings = {
        depthUnit: DepthUnit.Meters,
        pressureUnit: PressureUnit.Bar,
        temperatureUnit: TemperatureUnit.Celsius,
        weightUnit: WeightUnit.Kilograms,
      };
    }
  }

  get depthUnit(): DepthUnit {
    return this.data.settings?.depthUnit ?? DepthUnit.Meters;
  }
  set depthUnit(value: DepthUnit) {
    this.data.settings!.depthUnit = value;
  }

  get pressureUnit(): PressureUnit {
    return this.data.settings?.pressureUnit ?? PressureUnit.Bar;
  }
  set pressureUnit(value: PressureUnit) {
    this.data.settings!.pressureUnit = value;
  }

  get temperatureUnit(): TemperatureUnit {
    return this.data.settings?.temperatureUnit ?? TemperatureUnit.Celsius;
  }
  set temperatureUnit(value: TemperatureUnit) {
    this.data.settings!.temperatureUnit = value;
  }

  get weightUnit(): WeightUnit {
    return this.data.settings?.weightUnit ?? WeightUnit.Kilograms;
  }
  set weightUnit(value: WeightUnit) {
    this.data.settings!.weightUnit = value;
  }

  async save(): Promise<void> {
    this.data.settings = assertValid<UserSettingsDocument>(
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
          settings: this.data.settings,
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
