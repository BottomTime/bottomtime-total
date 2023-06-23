import { Document } from 'mongodb';

export interface TankDocument extends Document {
  _id: string;
  name: string;
  material: string;
  volume: number;
  workingPressure: number;
}
