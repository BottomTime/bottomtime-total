import { z } from 'zod';

import {
  BooleanString,
  DateWithTimezoneSchema,
  DepthUnit,
  ExposureSuit,
  PressureUnit,
  SortOrder,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from './constants';
import { DiveSiteSchema } from './dive-sites';
import { CreateOrUpdateTankParamsSchema } from './tanks';
import { SuccinctProfileSchema } from './users';

export enum LogEntrySortBy {
  EntryTime = 'entryTime',
  LogNumber = 'logNumber',
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
    entryTime: DateWithTimezoneSchema,
    bottomTime: z.number().positive().optional(),
    duration: z.number().positive(),
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
  samples: LogEntrySampleSchema.array().optional(),
});
export type CreateOrUpdateLogEntryParamsDTO = z.infer<
  typeof CreateOrUpdateLogEntryParamsSchema
>;

export const LogEntrySchema = LogEntryBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  creator: SuccinctProfileSchema,
  site: DiveSiteSchema.optional(),
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
  site: true,
  tags: true,
  timing: true,
  updatedAt: true,
});
export type SuccinctLogEntryDTO = z.infer<typeof SuccinctLogEntrySchema>;

export const ListLogEntriesParamsSchema = z
  .object({
    query: z.string().max(500),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
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
  }, 'Start date must be before end date.');
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

export const GetMostRecentDiveSitesRequestParamsSchema = z.object({
  count: z.coerce.number().int().positive().max(200).optional(),
});
export type GetMostRecentDiveSitesRequestParamsDTO = z.infer<
  typeof GetMostRecentDiveSitesRequestParamsSchema
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
  date: z.coerce.date(),
  owner: z.string(),
  finalized: BooleanString,
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
