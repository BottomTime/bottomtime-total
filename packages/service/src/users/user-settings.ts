import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';
import { UserData, UserDocument } from '../schemas';

type SettingsData = NonNullable<UserData['settings']>;

export class UserSettings {
  constructor(private readonly data: UserDocument) {}

  private get settings(): SettingsData {
    if (this.data.settings) return this.data.settings;

    this.data.settings = { profileVisibility: ProfileVisibility.FriendsOnly };
    return this.data.settings;
  }

  get profileVisibility(): ProfileVisibility {
    return this.settings.profileVisibility as ProfileVisibility;
  }
  set profileVisibility(value: ProfileVisibility) {
    this.settings.profileVisibility = value;
  }

  get depthUnit(): DepthUnit {
    return (this.settings.depthUnit ?? DepthUnit.Meters) as DepthUnit;
  }
  set depthUnit(value: DepthUnit) {
    this.settings.depthUnit = value;
  }

  get pressureUnit(): PressureUnit {
    return (this.settings.pressureUnit ?? PressureUnit.Bar) as PressureUnit;
  }
  set pressureUnit(value: PressureUnit) {
    this.settings.pressureUnit = value;
  }

  get temperatureUnit(): TemperatureUnit {
    return (this.settings.temperatureUnit ??
      TemperatureUnit.Celsius) as TemperatureUnit;
  }
  set temperatureUnit(value: TemperatureUnit) {
    this.settings.temperatureUnit = value;
  }

  get weightUnit(): WeightUnit {
    return (this.settings.weightUnit ?? WeightUnit.Kilograms) as WeightUnit;
  }
  set weightUnit(value: WeightUnit) {
    this.settings.weightUnit = value;
  }
}
