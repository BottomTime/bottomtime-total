import { Document } from 'mongodb';

export interface ApplicationDocument extends Document {
  _id: string;
  active: boolean;
  allowedOrigins?: string[];
  created: Date;
  name: string;
  description?: string;
  token: string;
  user: string;
}
