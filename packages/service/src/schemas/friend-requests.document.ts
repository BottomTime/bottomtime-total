import { HydratedDocument, InferSchemaType, Schema, model } from 'mongoose';
import { Collections } from './collections';

export const FriendRequestSchema = new Schema(
  {
    _id: { type: String, required: true },
    from: { type: String, required: true, ref: 'User' },
    to: { type: String, required: true, ref: 'User' },
    created: { type: Date, required: true },
    expires: { type: Date, required: true },
    accepted: { type: Boolean },
    reason: { type: String },
  },
  { collection: Collections.FriendRequests },
);

export const FriendRequestModelName = 'FriendRequest';
export type FriendRequestData = InferSchemaType<typeof FriendRequestSchema>;
export type FriendRequestDocument = HydratedDocument<FriendRequestData>;
export const FriendRequestModel = model(
  FriendRequestModelName,
  FriendRequestSchema,
);
