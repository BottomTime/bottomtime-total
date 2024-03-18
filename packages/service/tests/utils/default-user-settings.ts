import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

export const DefaultUserSettings = {
  depthUnit: DepthUnit.Meters,
  pressureUnit: PressureUnit.Bar,
  temperatureUnit: TemperatureUnit.Celsius,
  profileVisibility: ProfileVisibility.FriendsOnly,
  weightUnit: WeightUnit.Kilograms,
} as const;
