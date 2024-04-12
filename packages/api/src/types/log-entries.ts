import { z } from 'zod';

import { DepthUnit } from './constants';
import { SuccinctProfileSchema } from './users';

export const CreateOrUpdateLogEntryParamsSchema = z.object({
  logNumber: z.number().int().positive().optional(),

  entryTime: z.coerce.date(),
  timezone: z.string(),
  bottomTime: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),

  maxDepth: z.number().positive().optional(),
  maxDepthUnit: z.nativeEnum(DepthUnit).optional(),

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
