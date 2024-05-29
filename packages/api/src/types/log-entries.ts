import { z } from 'zod';

import {
  DateWithTimezoneSchema,
  DepthSchema,
  PressureUnit,
  SortOrder,
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
  o2Percent: z.number().min(0.0).max(1.0).optional(),
  hePercent: z.number().min(0.0).max(1.0).optional(),
});
export type LogEntryAirDTO = z.infer<typeof LogEntryAirSchema>;

const LogEntryBaseSchema = z.object({
  logNumber: z.number().int().positive().optional(),

  entryTime: DateWithTimezoneSchema,
  bottomTime: z.number().positive().optional(),
  duration: z.number().positive(),

  maxDepth: DepthSchema.optional(),

  air: LogEntryAirSchema.array().min(1).optional(),

  notes: z.string().max(5000).optional(),
});

export const CreateOrUpdateLogEntryParamsSchema = LogEntryBaseSchema.extend({
  site: z.string().uuid().optional(),
});
export type CreateOrUpdateLogEntryParamsDTO = z.infer<
  typeof CreateOrUpdateLogEntryParamsSchema
>;

export const LogEntrySchema = LogEntryBaseSchema.extend({
  id: z.string(),
  creator: SuccinctProfileSchema,
  site: DiveSiteSchema.optional(),
});
export type LogEntryDTO = z.infer<typeof LogEntrySchema>;

export const SuccinctLogEntrySchema = LogEntrySchema.pick({
  id: true,
  entryTime: true,
  creator: true,
  logNumber: true,
  maxDepth: true,
  bottomTime: true,
  duration: true,
  site: true,
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
  logEntries: z.array(SuccinctLogEntrySchema),
  totalCount: z.number().int(),
});
export type ListLogEntriesResponseDTO = z.infer<
  typeof ListLogEntriesResponseSchema
>;

export type GetNextAvailableLogNumberResponseDTO = {
  logNumber: number;
};
