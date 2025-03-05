import { z } from 'zod';

import { AgencySchema } from './certifications';
import {
  BooleanString,
  BuddyType,
  DepthUnit,
  ExposureSuit,
  GpsCoordinatesSchema,
  PressureUnit,
  SortOrder,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from './constants';
import { SuccinctDiveSiteSchema } from './dive-sites';
import { SuccinctOperatorSchema } from './operators';
import { CreateOrUpdateTankParamsSchema } from './tanks';
import { SuccinctProfileSchema } from './users';

export enum LogEntrySortBy {
  EntryTime = 'entryTime',
  LogNumber = 'logNumber',
  Rating = 'rating',
}

/** Indicates how log entry numbers will be generated during an import operation */
export enum LogNumberGenerationMode {
  /** Do not auto-generate log number during import. (This is the default mode.) */
  None = 'none',

  /**
   * A log number will be generated for for a log entry if one is not supplied in the import data.
   * Otherwise, the number in the import data will be used.
   */
  Auto = 'auto',

  /**
   * A log number will be generated for all log entries during import.
   * Log numbers found in the import data will be ignored.
   */
  All = 'all',
}

export const LogEntryAirSchema = CreateOrUpdateTankParamsSchema.extend({
  count: z.number().int().min(1).max(10),
  startPressure: z.number().min(0.0),
  endPressure: z.number().min(0.0),
  pressureUnit: z.nativeEnum(PressureUnit),
  o2Percent: z.number().min(0.0).max(100.0).optional(),
  hePercent: z.number().min(0.0).max(100.0).optional(),
})
  .refine(
    ({ startPressure, pressureUnit }) =>
      startPressure <= (pressureUnit === PressureUnit.Bar ? 300 : 4400),
    {
      path: ['startPressure'],
      message: 'Start pressure cannot be more than 300bar / 4400psi.',
    },
  )
  .refine(({ startPressure, endPressure }) => endPressure < startPressure, {
    path: ['endPressure'],
    message: 'End pressure cannot be greater than start pressure.',
  })
  .refine(
    ({ o2Percent, hePercent }) => {
      if (o2Percent && hePercent) {
        return o2Percent + hePercent <= 100;
      }

      return true;
    },
    {
      path: ['o2Percent', 'hePercent'],
      message: 'O2 and He percentages cannot add to more than 100%',
    },
  );
export type LogEntryAirDTO = z.infer<typeof LogEntryAirSchema>;

const LogEntryBaseSchema = z.object({
  logNumber: z.number().int().positive().optional(),

  timing: z.object({
    entryTime: z.number(),
    timezone: z.string(),
    bottomTime: z.number().positive().optional(),
    duration: z.number().positive(),
    surfaceInterval: z.number().positive().optional(),
  }),

  depths: z
    .object({
      depthUnit: z.nativeEnum(DepthUnit).optional(),
      averageDepth: z.number().positive().optional(),
      maxDepth: z.number().positive().optional(),
    })
    .optional(),

  equipment: z
    .object({
      weight: z.number().min(0).optional(),
      weightUnit: z.nativeEnum(WeightUnit).optional(),
      weightCorrectness: z.nativeEnum(WeightCorrectness).optional(),
      trimCorrectness: z.nativeEnum(TrimCorrectness).optional(),

      exposureSuit: z.nativeEnum(ExposureSuit).optional(),
      hood: z.boolean().optional(),
      gloves: z.boolean().optional(),
      boots: z.boolean().optional(),

      camera: z.boolean().optional(),
      torch: z.boolean().optional(),
      scooter: z.boolean().optional(),
    })
    .optional(),

  air: LogEntryAirSchema.array().optional(),

  conditions: z
    .object({
      airTemperature: z.number().optional(),
      surfaceTemperature: z.number().optional(),
      bottomTemperature: z.number().optional(),
      temperatureUnit: z.nativeEnum(TemperatureUnit).optional(),

      chop: z.number().min(1).max(5).optional(),
      current: z.number().min(1).max(5).optional(),
      weather: z.string().max(100).optional(),
      visibility: z.number().min(0).optional(),
    })
    .optional(),

  notes: z.string().max(5000).optional(),
  rating: z.number().min(0).max(5).optional(),
  tags: z.string().max(100).array().optional(),
});

export const LogEntrySampleSchema = z.object({
  offset: z.number().int().min(0),
  depth: z.number().gte(0),
  temperature: z.number().optional(),
  gps: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});
export type LogEntrySampleDTO = z.infer<typeof LogEntrySampleSchema>;

export const CreateOrUpdateLogEntryParamsSchema = LogEntryBaseSchema.extend({
  site: z.string().uuid().optional(),
  operator: z.string().uuid().optional(),
  samples: LogEntrySampleSchema.array().optional(),
});
export type CreateOrUpdateLogEntryParamsDTO = z.infer<
  typeof CreateOrUpdateLogEntryParamsSchema
>;

export const LogEntrySchema = LogEntryBaseSchema.extend({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  creator: SuccinctProfileSchema,
  site: SuccinctDiveSiteSchema.optional(),
  operator: SuccinctOperatorSchema.optional(),
  samples: LogEntrySampleSchema.array().optional(),
});
export type LogEntryDTO = z.infer<typeof LogEntrySchema>;

export type LogEntryConditionsDTO = NonNullable<LogEntryDTO['conditions']>;
export type LogEntryDepthsDTO = NonNullable<LogEntryDTO['depths']>;
export type LogEntryEquipmentDTO = NonNullable<LogEntryDTO['equipment']>;
export type LogEntryTimingDTO = LogEntryDTO['timing'];

export const SuccinctLogEntrySchema = LogEntrySchema.pick({
  createdAt: true,
  creator: true,
  id: true,
  depths: true,
  logNumber: true,
  notes: true,
  operator: true,
  rating: true,
  site: true,
  tags: true,
  timing: true,
  updatedAt: true,
});
export type SuccinctLogEntryDTO = z.infer<typeof SuccinctLogEntrySchema>;

export const ListLogEntriesParamsSchema = z
  .object({
    query: z.string().max(500),
    startDate: z.coerce.number().optional(),
    endDate: z.coerce.number().optional(),
    location: GpsCoordinatesSchema,
    radius: z.coerce.number().positive().max(500),
    minRating: z.coerce.number().min(0).max(5),
    maxRating: z.coerce.number().min(0).max(5),
    skip: z.coerce.number().int().min(0),
    limit: z.coerce.number().int().min(1).max(500),
    sortBy: z.nativeEnum(LogEntrySortBy),
    sortOrder: z.nativeEnum(SortOrder),
  })
  .partial()
  .refine((params) => {
    if (params.startDate && params.endDate) {
      return params.startDate < params.endDate;
    }

    return true;
  }, 'Start date must be before end date.')
  .refine((params) => {
    if (params.minRating && params.maxRating) {
      return params.minRating < params.maxRating;
    }

    return true;
  }, 'Minimum rating must be less than maximum rating.');
export type ListLogEntriesParamsDTO = z.infer<
  typeof ListLogEntriesParamsSchema
>;

export const ListLogEntriesResponseSchema = z.object({
  data: z.array(SuccinctLogEntrySchema),
  totalCount: z.number().int(),
});

export type GetNextAvailableLogNumberResponseDTO = {
  logNumber: number;
};

// TODO: Need a new name for this so it works for operators too.
export const GetMostRecentEntitiesParamsSchema = z.object({
  count: z.coerce.number().int().positive().max(200).optional(),
});
export type GetMostRecentEntitiesParamsDTO = z.infer<
  typeof GetMostRecentEntitiesParamsSchema
>;

export const CreateLogsImportParamsSchema = z
  .object({
    device: z.string().max(200),
    deviceId: z.string().max(200),
    bookmark: z.string().max(200),
  })
  .partial();
export type CreateLogsImportParamsDTO = z.infer<
  typeof CreateLogsImportParamsSchema
>;

export const LogsImportSchema = CreateLogsImportParamsSchema.extend({
  id: z.string(),
  date: z.number(),
  owner: z.string(),
  error: z.string().optional(),
  failed: z.coerce.boolean(),
  finalized: z.coerce.boolean(),
});
export type LogsImportDTO = z.infer<typeof LogsImportSchema>;

export const ListLogEntryImportsParamsSchema = z.object({
  showFinalized: BooleanString.optional(),
  skip: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});
export type ListLogEntryImportsParamsDTO = z.infer<
  typeof ListLogEntryImportsParamsSchema
>;

export const FinalizeImportParamsSchema = z
  .object({
    logNumberGenerationMode: z.nativeEnum(LogNumberGenerationMode),
    startingLogNumber: z.number().int().positive(),
  })
  .partial()
  .refine(
    // startingLogNumber is required when logNumberGenerationMode is "auto" or "all"
    (val) =>
      !val.logNumberGenerationMode ||
      val.logNumberGenerationMode === LogNumberGenerationMode.None ||
      !!val.startingLogNumber,
    {
      message:
        "`startingLogNumber` is required when `logNumberGenerationMode` is 'auto' or 'all'.",
      path: ['startingLogNumber'],
    },
  );
export type FinalizeImportParamsDTO = z.infer<
  typeof FinalizeImportParamsSchema
>;

export const CreateOrUpdateLogEntrySignatureSchema = z
  .object({
    buddyType: z.nativeEnum(BuddyType),
    agency: z.string().uuid().optional(),
    certificationNumber: z.string().max(200).optional(),
  })
  .refine(
    (val) =>
      (val.agency && val.certificationNumber) ||
      (!val.agency && !val.certificationNumber),
    'Agency and certification number must both be provided or both be omitted.',
  );
export type CreateOrUpdateLogEntrySignatureDTO = z.infer<
  typeof CreateOrUpdateLogEntrySignatureSchema
>;

export const LogEntrySignatureSchema = z.object({
  id: z.string(),
  signedOn: z.number(),
  buddy: SuccinctProfileSchema,
  type: z.nativeEnum(BuddyType),
  agency: AgencySchema.optional(),
  certificationNumber: z.string().max(200).optional(),
});
export type LogEntrySignatureDTO = z.infer<typeof LogEntrySignatureSchema>;

export const ListLogEntrySignaturesResponseSchema = z.object({
  data: LogEntrySignatureSchema.array(),
  totalCount: z.number().int(),
});
