import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import { Collections } from '../data';
import { TankMaterial } from '@bottomtime/api';

export const TankSchema = new Schema(
  {
    _id: { type: String, required: true },
    user: { type: String, ref: 'User', required: false },
    name: { type: String, required: true },
    material: {
      type: String,
      required: true,
      enum: Object.values(TankMaterial),
    },
    workingPressure: { type: Number, required: true },
    volume: { type: Number, required: true },
  },
  { collection: Collections.Tanks },
);

export type TankData = InferSchemaType<typeof TankSchema>;
export type TankDocument = HydratedDocument<TankData>;
export const TankModel = model('Tank', TankSchema);
