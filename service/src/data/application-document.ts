import { Document } from 'mongodb';

export interface ApplicationDocument extends Document {
  _id: string;
  apiKey: string;
  origins: string[];
  owner: string; // ??
  // TODO: Design this....
}
