import { z } from 'zod';
import { DepthUnit } from './constants';

export const DepthSchema = z.object({
  depth: z.number().min(0),
  unit: z.nativeEnum(DepthUnit),
});
export type Depth = z.infer<typeof DepthSchema>;

export interface GpsCoordinates {
  lat: number;
  lon: number;
}

export interface Range {
  min: number;
  max: number;
}
