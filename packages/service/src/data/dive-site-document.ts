import { Document } from 'mongodb';

export interface DiveSiteReviewDocument extends Document {
  _id: string;
  creator: string;
  createdOn: Date;
  updatedOn?: Date;
  rating: number;
  difficulty?: number;
  title: string;
  comments?: string;
}

export interface DiveSiteDocument extends Document {
  _id: string;
  creator: string;
  createdOn: Date;
  updatedOn?: Date;

  name: string;
  description?: string;

  location: string;
  directions?: string;
  gps?: {
    type: 'Point';
    coordinates: [number, number];
  };

  freeToDive?: boolean;
  shoreAccess?: boolean;

  averageRating?: number;
  averageDifficulty?: number;
  reviews?: DiveSiteReviewDocument[];
}
