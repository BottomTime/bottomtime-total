import { z } from 'zod';

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

export const GpsCoordinatesSchema = z
  .string()
  .transform((val) => {
    const values = val.split(',');
    return z
      .tuple([
        z.coerce.number().min(-90).max(90),
        z.coerce.number().min(-180).max(180),
      ])
      .parse(values);
  })
  .transform((val) => ({ lat: val[0], lon: val[1] }));
export type GpsCoordinates = z.infer<typeof GpsCoordinatesSchema>;

export const RatingRangeSchema = z
  .string()
  .transform((val) => {
    const values = val.split(',');
    return z
      .tuple([z.coerce.number().min(0).max(5), z.coerce.number().min(0).max(5)])
      .parse(values);
  })
  .refine((val) => val[0] <= val[1], {
    message: 'Minimum rating cannot be greater than the maximum rating',
  })
  .transform((val) => ({ min: val[0], max: val[1] }));
export type RatingRange = z.infer<typeof RatingRangeSchema>;

export const SuccessResponseSchema = z.object({
  succeeded: z.boolean(),
});
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

export const DepthSchema = z.object({
  depth: z.number().min(0),
  unit: z.nativeEnum(DepthUnit),
});
export type DepthDTO = z.infer<typeof DepthSchema>;
