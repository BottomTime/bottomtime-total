import { z } from 'zod';

import { DateWithTimezoneSchema, DepthSchema } from './constants';
import { SuccinctProfileSchema } from './users';

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
