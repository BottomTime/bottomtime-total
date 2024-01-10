import { z } from 'zod';
import { DepthDTO, SuccinctProfileDTO } from '@bottomtime/api';

export const AnonymousUserProfile: SuccinctProfileDTO = {
  userId: '',
  username: '<anonymous>',
  memberSince: new Date(0),
  name: 'Anonymous',
};

export type Depth = DepthDTO;

export const GpsCoordinatesSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lon: z.number().gte(-180).lte(180),
});
export type GpsCoordinates = z.infer<typeof GpsCoordinatesSchema>;

export type Maybe<T> = T | null | undefined;
