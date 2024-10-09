import { isPossiblePhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

export const DateRegex = /^\d{4}-\d{2}-\d{2}$/;
export const DateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?$/;
export const FuzzyDateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;

export enum BuddyType {
  Buddy = 'buddy',
  Divemaster = 'divemaster',
  Instructor = 'instructor',
}

export enum DepthUnit {
  Meters = 'm',
  Feet = 'ft',
}

export enum ExposureSuit {
  Drysuit = 'drysuit',
  None = 'none',
  Other = 'other',
  Rashguard = 'rashguard',
  Shorty = 'shorty',
  Wetsuit3mm = '3mm',
  Wetsuit5mm = '5mm',
  Wetsuit7mm = '7mm',
  Wetsuit9mm = '9mm',
}

export enum PressureUnit {
  Bar = 'bar',
  PSI = 'psi',
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

export enum TrimCorrectness {
  Good = 'good',
  HeadDown = 'headDown',
  KneesDown = 'kneesDown',
}

export enum UserRole {
  User = 'user',
  Admin = 'admin',
}

export enum WeightCorrectness {
  Good = 'good',
  Over = 'over',
  Under = 'under',
}

export enum WeightUnit {
  Kilograms = 'kg',
  Pounds = 'lbs',
}

export const BooleanString = z
  .string()
  .regex(
    /^(true|false|1|0)$/i,
    'Value must be one of "true", "false", "1", or "0"',
  )
  .transform((value) => /^(true|1)$/i.test(value));

/**
 * Parses, validates, and transforms a string in the format "<lat>,<lon>" into a {@link GpsCoordinates} object.
 * @example
 * // '25.0865,-80.4473' becomes...
 * {
 *   lat: 25.0865,
 *   lon: -80.4473,
 * }
 */
export const GpsCoordinatesSchema = z
  .string()
  .superRefine((val, ctx) => {
    const values = val.split(',');
    const validation = z
      .tuple([
        z.coerce.number().min(-90).max(90),
        z.coerce.number().min(-180).max(180),
      ])
      .safeParse(values);

    if (!validation.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be in the format "<lat>,<lon>"',
        path: ctx.path,
      });
      validation.error.issues.forEach((issue) => {
        ctx.addIssue({
          code: 'custom',
          message: issue.message,
          path: [...ctx.path, ...issue.path],
        });
      });
    }
  })
  .transform((val) => {
    const values = val.split(',');
    return z
      .tuple([
        z.coerce.number().min(-90).max(90),
        z.coerce.number().min(-180).max(180),
      ])
      .transform(([lat, lon]) => ({ lat, lon }))
      .parse(values);
  });
export type GpsCoordinates = z.infer<typeof GpsCoordinatesSchema>;
export type GpsCoordinatesWithRadius = GpsCoordinates & { radius: number };

/**
 * Uses libphonenumber-js to parse, validate, and transform a string into a proper phone number.
 * https://www.npmjs.com/package/libphonenumber-js
 */
export const PhoneNumber = z
  .string()
  .refine(
    (val) => isPossiblePhoneNumber(val, 'US'),
    'Must be a valid phone number',
  );

/**
 * Parses, validates, and transforms a string in the format "<min-rating>,<max-rating>" into a {@link RatingRange} object.
 * @example
 * // '1.0,2.3' becomes...
 * {
 *   min: 1.0,
 *   max: 2.3,
 * }
 */
export const RatingRangeSchema = z
  .string()
  .superRefine((val, ctx) => {
    const values = val.split(',');
    const validation = z
      .tuple([z.coerce.number().min(0).max(5), z.coerce.number().min(0).max(5)])
      .refine(([min, max]) => min <= max, {
        message: 'Minimum rating cannot be greater than the maximum rating',
      })
      .safeParse(values);

    if (!validation.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be in the format "<min-rating>,<max-rating>"',
        path: ctx.path,
      });
      validation.error.issues.forEach((issue) => {
        ctx.addIssue({
          code: 'custom',
          message: issue.message,
          path: [...ctx.path, ...issue.path],
        });
      });
    }
  })
  .transform((val) => {
    const values = val.split(',');
    return z
      .tuple([z.coerce.number().min(0).max(5), z.coerce.number().min(0).max(5)])
      .transform(([min, max]) => ({ min, max }))
      .parse(values);
  });
export type RatingRange = z.infer<typeof RatingRangeSchema>;

export const SlugRegex = /^[a-z0-9\-$_.+!*'()]+$/i;

export const SuccessFailResponseSchema = z.object({
  succeeded: z.boolean(),
  reason: z.string().optional(),
});
export type SuccessFailResponseDTO = z.infer<typeof SuccessFailResponseSchema>;

export const DepthSchema = z
  .object({
    depth: z.number().min(0),
    unit: z.nativeEnum(DepthUnit),
  })
  .refine(
    ({ depth, unit }) =>
      unit === DepthUnit.Meters ? depth <= 300 : depth <= 984.252,
    { message: 'Depth may not exceed 300m (~984ft)' },
  );
export type DepthDTO = z.infer<typeof DepthSchema>;

export const WeightSchema = z.object({
  weight: z.number().min(0),
  unit: z.nativeEnum(WeightUnit),
});
export type WeightDTO = z.infer<typeof WeightSchema>;

export const PressureSchema = z.object({
  pressure: z.number().min(0),
  unit: z.nativeEnum(PressureUnit),
});
export type PressureDTO = z.infer<typeof PressureSchema>;

export const DateWithTimezoneSchema = z.object({
  date: z.string().regex(DateTimeRegex),
  timezone: z.string(),
});
export type DateWithTimezoneDTO = z.infer<typeof DateWithTimezoneSchema>;

export type AppMetricsDTO = {
  users: {
    total: number;
    active: number;
    activeLastMonth: number;
  };
  diveSites: {
    total: number;
  };
  logEntries: {
    total: number;
    addedLastWeek: number;
    addedLastMonth: number;
  };
};

export type PingResponseDTO = {
  api: string;
  apiVersion: string;
  uptime: number;
};
