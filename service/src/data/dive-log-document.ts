import { Document } from 'mongodb';

export interface DiveLogDocument extends Document {
  _id: string;
  timezone: string;
  entryTime: Date;
  location: string;
  site: string;
  gps: {
    type: 'Point';
    coordinates: [number, number];
  };
}
