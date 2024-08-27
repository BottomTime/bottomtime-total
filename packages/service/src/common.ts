import {
  AccountTier,
  DepthDTO,
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  SuccinctProfileDTO,
  TemperatureUnit,
  WeightUnit,
} from '@bottomtime/api';

import { z } from 'zod';

import { UserSettings } from './users';

export const AnonymousUserProfile: SuccinctProfileDTO = {
  userId: '',
  username: '<anonymous>',
  accountTier: AccountTier.Basic,
  logBookSharing: LogBookSharing.Private,
  memberSince: new Date(0),
  name: 'Anonymous',
};

export const DefaultUserSettings: UserSettings = {
  depthUnit: DepthUnit.Meters,
  pressureUnit: PressureUnit.Bar,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
} as const;

export type Depth = DepthDTO;

export const GpsCoordinatesSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
});
export type GpsCoordinates = z.infer<typeof GpsCoordinatesSchema>;

export type PageRenderProps = {
  title: string;
};

export const Queues: Record<string, symbol> = {
  email: Symbol('SQSQueue_email'),
} as const;
