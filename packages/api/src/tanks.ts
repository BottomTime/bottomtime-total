import { TankMaterial } from './constants';
import { z } from './zod';

export const TankSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'The unique identifier for the tank.',
  }),
  name: z.string().trim().max(100).openapi({
    description: 'A descriptive name for the tank.',
    example: 'Aluminum 80',
  }),
  material: z.nativeEnum(TankMaterial).openapi({
    description: 'The material the tank is made of.',
    example: TankMaterial.Steel,
  }),
  workingPressure: z.number().positive().max(500).openapi({
    description: 'The working pressure of the tank, in Bar.',
    example: 232,
  }),
  volume: z.number().positive().max(30).openapi({
    description: 'The volume of the tank, in Liters.',
    example: 11.1,
  }),
  isSystem: z.boolean().openapi({
    description:
      'Whether or not this is a system tank (as opposed to a user-defined tank).',
  }),
});
export type TankDTO = z.infer<typeof TankSchema>;

export const CreateOrUpdateTankParamsSchema = TankSchema.omit({
  id: true,
  isSystem: true,
});
export type CreateOrUpdateTankParamsDTO = z.infer<
  typeof CreateOrUpdateTankParamsSchema
>;

export const ListTanksResponseSchema = z.object({
  tanks: TankSchema.array(),
  totalCount: z.number().int(),
});
export type ListTanksResponseDTO = z.infer<typeof ListTanksResponseSchema>;
