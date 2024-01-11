import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserSettingsDTO,
  WeightUnit,
} from '@bottomtime/api';
import { UserData, UserDocument } from '../schemas';

type SettingsData = NonNullable<UserData['settings']>;

export class UserSettings {
  constructor(private readonly data: UserDocument) {}

  private get settings(): SettingsData {
    if (this.data.settings) return this.data.settings;

    this.data.settings = {
      depthUnit: DepthUnit.Meters,
      pressureUnit: PressureUnit.Bar,
      temperatureUnit: TemperatureUnit.Celsius,
      weightUnit: WeightUnit.Kilograms,
      profileVisibility: ProfileVisibility.FriendsOnly,
    };
    return this.data.settings;
  }

  get profileVisibility(): ProfileVisibility {
    return this.settings.profileVisibility ?? ProfileVisibility.FriendsOnly;
  }
  set profileVisibility(value: ProfileVisibility) {
    this.settings.profileVisibility = value;
  }

  get depthUnit(): DepthUnit {
    return this.settings.depthUnit ?? DepthUnit.Meters;
  }
  set depthUnit(value: DepthUnit) {
    this.settings.depthUnit = value;
  }

  get pressureUnit(): PressureUnit {
    return this.settings.pressureUnit ?? PressureUnit.Bar;
  }
  set pressureUnit(value: PressureUnit) {
    this.settings.pressureUnit = value;
  }

  get temperatureUnit(): TemperatureUnit {
    return this.settings.temperatureUnit ?? TemperatureUnit.Celsius;
  }
  set temperatureUnit(value: TemperatureUnit) {
    this.settings.temperatureUnit = value;
  }

  get weightUnit(): WeightUnit {
    return this.settings.weightUnit ?? WeightUnit.Kilograms;
  }
  set weightUnit(value: WeightUnit) {
    this.settings.weightUnit = value;
  }

  toJSON(): UserSettingsDTO {
    return {
      depthUnit: this.depthUnit,
      pressureUnit: this.pressureUnit,
      temperatureUnit: this.temperatureUnit,
      weightUnit: this.weightUnit,
      profileVisibility: this.profileVisibility,
    };
  }
}
