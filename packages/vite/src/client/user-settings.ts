import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  UserDTO,
  WeightUnit,
} from '@bottomtime/api';

import { AxiosInstance } from 'axios';

export class UserSettings {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: UserDTO,
  ) {}

  get depthUnit(): DepthUnit {
    return this.data.settings.depthUnit;
  }
  set depthUnit(value: DepthUnit) {
    this.data.settings.depthUnit = value;
  }

  get pressureUnit(): PressureUnit {
    return this.data.settings.pressureUnit;
  }
  set pressureUnit(value: PressureUnit) {
    this.data.settings.pressureUnit = value;
  }

  get temperatureUnit(): TemperatureUnit {
    return this.data.settings.temperatureUnit;
  }
  set temperatureUnit(value: TemperatureUnit) {
    this.data.settings.temperatureUnit = value;
  }

  get weightUnit(): WeightUnit {
    return this.data.settings.weightUnit;
  }
  set weightUnit(value: WeightUnit) {
    this.data.settings.weightUnit = value;
  }

  get profileVisibility(): ProfileVisibility {
    return this.data.settings.profileVisibility;
  }
  set profileVisibility(value: ProfileVisibility) {
    this.data.settings.profileVisibility = value;
  }

  async save(): Promise<void> {
    await this.client.put(
      `/api/users/${this.data.username}/settings`,
      this.data.settings,
    );
  }
}
