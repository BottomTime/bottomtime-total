import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import { Collections } from './collections';
import { DepthUnit } from '@bottomtime/api';
import { GeoJsonSchema } from './geo-json.schema';

export const DiveSiteSchema = new Schema(
  {
    _id: { type: String, required: true },
    creator: { type: String, ref: 'User', required: true },
    createdOn: { type: Date, required: true },
    updatedOn: Date,

    name: { type: String, required: true },
    description: String,
    depth: {
      type: {
        _id: false,
        depth: { type: Number, required: true },
        unit: { type: String, enum: Object.values(DepthUnit), required: true },
      },
      required: false,
    },

    location: { type: String, required: true },
    directions: String,
    gps: GeoJsonSchema,

    freeToDive: Boolean,
    shoreAccess: Boolean,

    averageRating: Number,
    averageDifficulty: Number,
    reviews: {
      type: [
        {
          _id: { type: String, required: true },
          creator: { type: String, ref: 'User', required: true },
          createdOn: { type: Date, required: true },
          updatedOn: Date,

          title: { type: String, required: true },
          rating: { type: Number, required: true },

          difficulty: Number,
          comments: String,
        },
      ],
      required: false,
    },
  },
  { collection: Collections.DiveSites },
);

export type DiveSiteData = InferSchemaType<typeof DiveSiteSchema>;
export type DiveSiteDocument = HydratedDocument<DiveSiteData>;
export const DiveSiteModel = model('DiveSite', DiveSiteSchema);
