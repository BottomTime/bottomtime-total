import { DepthSchema } from '../common';
import { z } from 'zod';

export const DiveSiteReviewSchema = z.object({
  _id: z.string().uuid(),
  creator: z.string().uuid(),
  createdOn: z.coerce.date(),
  updatedOn: z.coerce.date().optional(),

  title: z.string().trim().min(1).max(200),
  rating: z.number().min(1).max(5),

  difficulty: z.number().min(1).max(5).optional(),
  comments: z.string().trim().max(1000).optional(),
});
export type DiveSiteReviewDocument = z.infer<typeof DiveSiteReviewSchema>;

export const DiveSiteSchema = z.object({
  _id: z.string().uuid(),
  creator: z.string().uuid(),
  createdOn: z.coerce.date(),
  updatedOn: z.coerce.date().optional(),

  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  depth: DepthSchema.optional(),

  location: z.string().trim().min(1).max(200),
  directions: z.string().trim().max(500).optional(),
  gps: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90),
      ]),
    })
    .optional(),

  freeToDive: z.boolean().optional(),
  shoreAccess: z.boolean().optional(),

  averageRating: z.number().min(1).max(5).optional(),
  averageDifficulty: z.number().min(1).max(5).optional(),
  reviews: z.array(DiveSiteReviewSchema).optional(),
});
export type DiveSiteDocument = z.infer<typeof DiveSiteSchema>;
