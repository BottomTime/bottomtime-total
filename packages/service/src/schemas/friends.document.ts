import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import { Collections } from './collections';

export const FriendSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    friendId: { type: String, required: true, ref: 'User' },
    friendsSince: { type: Date, required: true },
  },
  { collection: Collections.Friends },
);

export const FriendModelName = 'Friend';
export type FriendData = InferSchemaType<typeof FriendSchema>;
export type FriendDocument = HydratedDocument<FriendData>;
export const FriendModel = model(FriendModelName, FriendSchema);
