import { z } from 'zod';
import { DepthUnit } from './constants';

export const BooleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const DepthSchema = z.object({
  depth: z.number().min(0),
  unit: z.nativeEnum(DepthUnit),
});
export type Depth = z.infer<typeof DepthSchema>;

export const GpsCoordinatesSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
});
export type GpsCoordinates = z.infer<typeof GpsCoordinatesSchema>;

export interface Range {
  min: number;
  max: number;
}
