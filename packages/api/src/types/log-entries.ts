import { z } from 'zod';

import { DateWithTimezoneSchema, DepthSchema, SortOrder } from './constants';
import { SuccinctProfileSchema, UsernameSchema } from './users';

export enum LogEntrySortBy {
  EntryTime = 'entryTime',
}

export const CreateOrUpdateLogEntryParamsSchema = z.object({
  logNumber: z.number().int().positive().optional(),

  entryTime: DateWithTimezoneSchema,
  bottomTime: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),

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

export const ListLogEntriesParamsSchema = z
  .object({
    query: z.string().max(500),
    dateRange: z
      .object({
        start: z.coerce.date(),
        end: z.coerce.date(),
      })
      .partial(),
    owner: UsernameSchema,
    skip: z.number().int().min(0),
    limit: z.number().int().min(1).max(500),
    sortBy: z.nativeEnum(LogEntrySortBy),
    sortOrder: z.nativeEnum(SortOrder),
  })
  .partial();
export type ListLogEntriesParamsDTO = z.infer<
  typeof ListLogEntriesParamsSchema
>;
