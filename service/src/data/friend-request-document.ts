import { Document } from 'mongodb';

export interface FriendRequestDocument extends Document {
  _id: string;
  from: string;
  to: string;
  created: Date;
  expires: Date;
}
