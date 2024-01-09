import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';
import { UserData } from '../../src/schemas';

export const DefaultUserSettings: UserData['settings'] = {
  depthUnit: DepthUnit.Meters,
  pressureUnit: PressureUnit.Bar,
  temperatureUnit: TemperatureUnit.Celsius,
  profileVisibility: ProfileVisibility.FriendsOnly,
  weightUnit: WeightUnit.Kilograms,
} as const;
