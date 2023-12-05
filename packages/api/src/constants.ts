import { z } from './zod';

export const DateRegex = /^\d{4}-\d{2}-\d{2}$/;

export enum DepthUnit {
  Meters = 'm',
  Feet = 'ft',
}

export enum PressureUnit {
  Bar = 'bar',
  PSI = 'psi',
}

export enum ProfileVisibility {
  Private = 'private',
  FriendsOnly = 'friends',
  Public = 'public',
}

export enum SortOrder {
  Ascending = 'asc',
  Descending = 'desc',
}

export enum TankMaterial {
  Aluminum = 'al',
  Steel = 'fe',
}

export enum TemperatureUnit {
  Celsius = 'C',
  Fahrenheit = 'F',
}

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

export enum WeightUnit {
  Kilograms = 'kg',
  Pounds = 'lbs',
}

export const SuccessResponseSchema = z.object({
  succeeded: z.boolean(),
});
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
