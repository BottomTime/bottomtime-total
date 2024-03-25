import {
  DepthUnit,
  PressureUnit,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

export const DefaultUserSettings = {
  depthUnit: DepthUnit.Meters,
  pressureUnit: PressureUnit.Bar,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
} as const;
