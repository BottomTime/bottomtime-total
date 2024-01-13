import { z } from 'zod';
import {
  DepthDTO,
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
  SuccinctProfileDTO,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';
import { UserSettings } from './users';

export const AnonymousUserProfile: SuccinctProfileDTO = {
  userId: '',
  username: '<anonymous>',
  memberSince: new Date(0),
  name: 'Anonymous',
};

export const DefaultUserSettings: UserSettings = {
  depthUnit: DepthUnit.Meters,
  pressureUnit: PressureUnit.Bar,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  profileVisibility: ProfileVisibility.FriendsOnly,
} as const;

export type Depth = DepthDTO;

export const GpsCoordinatesSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
});
export type GpsCoordinates = z.infer<typeof GpsCoordinatesSchema>;

export type Maybe<T> = T | null | undefined;

export type PageRenderProps = {
  title: string;
};
