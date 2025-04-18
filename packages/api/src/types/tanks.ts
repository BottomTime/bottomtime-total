import { z } from 'zod';

import { BooleanString, TankMaterial } from './constants';

export const TankSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().max(100),
  material: z.nativeEnum(TankMaterial),
  workingPressure: z.number().positive().max(500),
  volume: z.number().positive().max(30),
  isSystem: z.boolean(),
});
export type TankDTO = z.infer<typeof TankSchema>;

export const CreateOrUpdateTankParamsSchema = TankSchema.omit({
  id: true,
  isSystem: true,
});
export type CreateOrUpdateTankParamsDTO = z.infer<
  typeof CreateOrUpdateTankParamsSchema
>;

export const ListUserTanksParamsSchema = z.object({
  includeSystem: BooleanString.optional(),
});
export type ListUserTanksParamsDTO = z.infer<typeof ListUserTanksParamsSchema>;

export const ListTanksResponseSchema = z.object({
  data: TankSchema.array(),
  totalCount: z.number().int(),
});
