import { z } from 'zod';

import { DateWithTimezoneSchema, DepthSchema, SortOrder } from './constants';
import { SuccinctProfileSchema } from './users';

export enum LogEntrySortBy {
  EntryTime = 'entryTime',
  LogNumber = 'logNumber',
}

export const CreateOrUpdateLogEntryParamsSchema = z.object({
  logNumber: z.number().int().positive().optional(),

  entryTime: DateWithTimezoneSchema,
  bottomTime: z.number().positive().optional(),
  duration: z.number().positive(),

  maxDepth: DepthSchema.optional(),

  notes: z.string().max(5000).optional(),
});
export type CreateOrUpdateLogEntryParamsDTO = z.infer<
  typeof CreateOrUpdateLogEntryParamsSchema
>;

export const LogEntrySchema = CreateOrUpdateLogEntryParamsSchema.extend({
  id: z.string(),
  creator: SuccinctProfileSchema,
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
