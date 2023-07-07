import { Document } from 'mongodb';

export interface CertificationDocument extends Document {
  _id: string;
  agency: string;
  course: string;
}
