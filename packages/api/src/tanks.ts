import { TankMaterial } from './constants';
import { z } from 'zod';

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
  includeSystem: z.coerce.boolean().default(false),
});
export type ListUserTanksParamsDTO = z.infer<typeof ListUserTanksParamsSchema>;

export const ListTanksResponseSchema = z.object({
  tanks: TankSchema.array(),
  totalCount: z.number().int(),
});
export type ListTanksResponseDTO = z.infer<typeof ListTanksResponseSchema>;
