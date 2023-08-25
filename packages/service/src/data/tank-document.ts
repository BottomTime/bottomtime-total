import { z } from 'zod';
import { TankMaterial } from '../constants';

export const TankSchema = z.object({
  _id: z.string().uuid(),
  name: z.string().trim().max(100),
  material: z.nativeEnum(TankMaterial),
  workingPressure: z.number().positive().max(500),
  volume: z.number().positive().max(30),
});
export type TankDocument = z.infer<typeof TankSchema>;
