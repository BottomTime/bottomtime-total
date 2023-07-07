import { Document } from 'mongodb';

export interface DiveSiteDocument extends Document {
  _id: string;
  name: string;
}
